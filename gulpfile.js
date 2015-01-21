var gulp = require('gulp');
var plg = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'gulp.*'],
	replaceString: /\bgulp[\-.]/
});
global.plg = plg;

var utils = require('./gulp/utils');
var config = require('./gulp/config');

if (process.version != config.nodeVersion) {
	utils.logGulpError('Incompatible node.js version\n', 'gulpfile.js', new Error('This gulpfile requires node.js version ' + config.nodeVersion));
	return;
}

// system
var os = require('os');
var fs = require('fs');
var del = require('del');
var path = require('path');
var spawn = require('child_process').spawn;
var toml = require('toml');
var source = require('vinyl-source-stream');
var lazypipe = require('lazypipe');
var exorcist  = require('exorcist');
var mold = require('mold-source-map');
var domain = require('domain');

// Browserify the mighty one
var browserify = require('browserify'),
	es6ify = require('es6ify'),
	ngminify = require('browserify-ngmin'),
	bulkify = require('bulkify'),
	uglifyify = require('uglifyify'),
	brfs = require('brfs');

// Modules
var serve = require('./serve');

// Configuration
var package = require('./package.json');
var paths = require('./gulp/paths');

var filterTransform = require('filter-transform');

// Global variables
var childProcess = null;
var args = process.argv.slice(2);

require('toml-require').install();

/**
 * Gulp Taks
 */

gulp.task('build:scripts:vendor:min', function() {
	return gulp.src(paths.scripts.inputDeps)
		.pipe(plg.plumber())
		.pipe(plg.tap(function (file, t) {
			var appConfig = toml.parse(file.contents);
			var dependencies = [];

			for(var i = 0; i < appConfig.application.dependencies.length; i++) {
				var resolvedFileOriginal = paths.scripts.inputAppsFolder + appConfig.application.dependencies[i];

				if (fs.existsSync(resolvedFileOriginal)) {
					var resolvedFile = resolvedFileOriginal.replace('.js', '.min.js');

					if (!fs.existsSync(resolvedFile) && !fs.existsSync(path.resolve(__dirname, paths.scripts.cacheOutput, path.basename(resolvedFileOriginal)))) {
						dependencies.push(resolvedFileOriginal);
					}
				}
			}

			return gulp.src(dependencies)
				.pipe(plg.plumber())
				.pipe(plg.sourcemaps.init())
				.pipe(plg.ngAnnotate())
				.pipe(plg.uglify())
				.pipe(plg.sourcemaps.write('.'))
				.pipe(gulp.dest(paths.scripts.cacheOutput));
		}))
		.pipe(gulp.dest(paths.scripts.output));
});

gulp.task('build:scripts:core', ['clean:dist'], function() {
	var prodPipeline = lazypipe()
		.pipe(plg.uglify);

	return gulp.src(paths.scripts.input)
		.pipe(plg.plumber())
		.pipe(config.isDebugable ? plg.sourcemaps.init() : plg.util.noop())
		.pipe(plg.traceur())
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop())
		.pipe(config.isDebugable ? plg.sourcemaps.write('.', {sourceMappingURLPrefix: '/js/'}) : plg.util.noop())
		.pipe(gulp.dest(paths.scripts.output));
});

gulp.task('build:scripts:vendor', ['clean:dist', 'build:scripts:vendor:min', 'lint:scripts', 'build:scripts:core'], function() {
	return gulp.src(paths.scripts.inputDeps)
		.pipe(plg.plumber())
		.pipe(plg.tap(function (file, t) {
			var appConfig = toml.parse(file.contents);
			var dependencies = [];

			for(var i = 0; i < appConfig.application.dependencies.length; i++) {
				var resolvedFileOriginal = paths.scripts.inputAppsFolder + appConfig.application.dependencies[i];

				var resolvedFile = '';
				if (config.isProduction) {
					resolvedFile = resolvedFileOriginal.replace('.js', '.min.js');

					if (!fs.existsSync(resolvedFile)) {
						resolvedFile = path.resolve(__dirname, paths.scripts.cacheOutput, path.basename(resolvedFileOriginal));

						if (fs.existsSync(resolvedFile)) {
							console.log('Took minified version for vendor library from cache: ', resolvedFile);
						}
					}

					if (!fs.existsSync(resolvedFile)) {
						console.log('Cannot find minified version for vendor library: ', appConfig.application.dependencies[i]);
						resolvedFile = resolvedFileOriginal;
					}
				} else resolvedFile = resolvedFileOriginal;

				if (!fs.existsSync(resolvedFile))
					throw new Error('Cannot find vendor library: "' + appConfig.application.dependencies[i] + '"');

				dependencies.push(resolvedFile);
			}

			var newName = file.relative.replace('.toml', '-vendor.js');

			return gulp.src(dependencies)
				.pipe(plg.plumber())
				.pipe(plg.sourcemaps.init())
				.pipe(plg.concat(newName))
				.pipe(plg.sourcemaps.write('.', {sourceMappingURLPrefix: '/js/'}))
				.pipe(gulp.dest(paths.scripts.output));
		}))
		.pipe(gulp.dest(paths.scripts.output));
});

var browserifyBundle = function(filename) {
	var basename = path.basename(filename);

	return gulp.src(filename, {read: false})
		.pipe(plg.tap(function (file){
			var d = domain.create();

			d.on("error", function(err) {
				utils.logGulpError('Browserify compile error:', file.path, err);
			});

			var uglifyifyTransformed = filterTransform(
				function(file) {
					return file.indexOf('traceur-runtime') < 0;
				},
				uglifyify);

			var ownCodebaseTransform = function(transform) {
				return filterTransform(
					function(file) {
						return file.indexOf(path.resolve(__dirname, paths.scripts.inputFolder)) > -1;
					},
					transform);
			};

			d.run(function (){
				var browserifyPipeline = browserify(file.path, {
					basedir: __dirname,
					debug: config.isDebugable
				})
					.add(es6ify.runtime)
					.transform(ownCodebaseTransform(es6ify))
					.transform(ownCodebaseTransform(bulkify))
					.transform(ownCodebaseTransform(brfs));

				if (config.isProduction) {
					browserifyPipeline = browserifyPipeline
						.transform(ownCodebaseTransform(ngminify))
						.transform(uglifyifyTransformed);
				}

				file.contents = browserifyPipeline
					.bundle();
			});
		}))
		.pipe(plg.streamify(plg.concat(basename)))
		.pipe(gulp.dest(paths.scripts.output));
};

var scriptBuildSteps = [];

paths.scripts.inputApps.forEach(function(appScript){
	var name = 'build:scripts-' + (scriptBuildSteps.length + 1);

	gulp.task(name, ['clean:dist', 'lint:scripts', 'build:translations', 'build:scripts:vendor'], function() {
		return browserifyBundle(appScript);
	});
	scriptBuildSteps.push(name);
});

// Lint scripts
gulp.task('lint:scripts', function () {
	return gulp.src(paths.scripts.inputAll)
		.pipe(plg.plumber())
		.pipe(plg.cached('lint:scripts'))
		.pipe(plg.tap(function(file, t){
			console.log('Linting: "' + file.relative + '" ...');
		}))
		.pipe(plg.jshint({
			esnext: true,
			noyield: true,
			'-W002': false,
			'-W014': false
		}))
		.pipe(plg.jshint.reporter(plg.jshintStylish))
		.pipe(plg.jshint.reporter('fail'));
});

// Process, lint, and minify less files
gulp.task('build:styles', ['clean:dist'], function() {
	var prodPipeline = lazypipe()
		.pipe(plg.minifyCss, {
			keepSpecialComments: 0
		});
		//.pipe(header, config.banner.min, { package : package })

	if (config.isDebugable) {
		prodPipeline = prodPipeline
			.pipe(plg.sourcemaps.write, '.', {sourceMappingURLPrefix: '/css/'});
	}

	prodPipeline = prodPipeline
		.pipe(gulp.dest, paths.styles.output)
		.pipe(plg.ignore.exclude, '*.map')
		.pipe(plg.gzip)
		.pipe(gulp.dest, paths.styles.output);

	return gulp.src(paths.styles.input)
		.pipe(plg.plumber())
		.pipe(config.isDebugable ? plg.sourcemaps.init() : plg.util.noop())
		.pipe(plg.less())
		.pipe(plg.autoprefixer('last 2 version', '> 1%'))
		//.pipe(header(config.banner.full, { package : package }))
		.pipe(config.isDebugable && !config.isProduction ? plg.sourcemaps.write('.', {sourceMappingURLPrefix: '/css/'}) : plg.util.noop())
		.pipe(!config.isProduction ? gulp.dest(paths.styles.output) : plg.util.noop())
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop());
});

// Copy static files into output folder
gulp.task('copy:vendor', ['clean:dist'], function() {
	return gulp.src(paths.vendor.input, {read: false})
		.pipe(plg.plumber())
		.pipe(plg.tap(function (file, t) {
			if (file.path.indexOf('min.js') < 0) {
				if (config.isProduction) {
					try {
						var minifiedVersion = file.path.replace('.js', '.min.js');
						file.contents = fs.readFileSync(minifiedVersion);
					} catch (err) {
						file.contents = fs.readFileSync(file.path);
					}
				} else
					file.contents = fs.readFileSync(file.path);
			}
		}))
		.pipe(gulp.dest(paths.vendor.output));
});

// Copy images into output folder
gulp.task('copy:images', ['clean:dist'], function() {
	return gulp.src(paths.img.input)
		.pipe(plg.plumber())
		.pipe(gulp.dest(paths.img.output));
});

// Copy fonts into output folder
gulp.task('copy:fonts', ['clean:dist'], function() {
	return gulp.src(paths.fonts.input)
		.pipe(plg.plumber())
		.pipe(gulp.dest(paths.fonts.output));
});

// Copy static files into output folder
gulp.task('copy:static', ['clean:dist'], function() {
	return gulp.src(paths.staticFiles)
		.pipe(plg.plumber())
		.pipe(gulp.dest(paths.output));
});

// Build translation files(toml -> json)
gulp.task('build:translations', ['clean:dist'], function() {
	return gulp.src(paths.translations.input)
		.pipe(plg.plumber())
		.pipe(plg.toml({to: JSON.stringify, ext: '.json'}))
		.pipe(gulp.dest(paths.translations.output));
});

var prodHtmlPipeline  = function (input, output) {
	return lazypipe()
		.pipe(plg.minifyHtml, {
			empty: true
		})
		.pipe(plg.rename, { suffix: '.min' })
		.pipe(gulp.dest, output)
		.pipe(plg.gzip)
		.pipe(gulp.dest, output);
};

var createHtmlPipeline = function (input, output) {
	return gulp.src(input)
		.pipe(plg.plumber())
		.pipe(plg.fileInclude())
		.pipe(gulp.dest(output))
		.pipe(config.isProduction ? prodHtmlPipeline(input, output)() : plg.util.noop());
};

var createJadePipeline = function (input, output) {
	return gulp.src(input)
		.pipe(plg.plumber())
		.pipe(plg.ignore(function(file){
			var basename = path.basename(file.relative);
			return basename.indexOf('_') == 0;
		}))
		.pipe(plg.jade())
		.pipe(gulp.dest(output))
		.pipe(config.isProduction ? prodHtmlPipeline(input, output)() : plg.util.noop());
};

// Build primary html files
gulp.task('build:html', ['clean:dist'], function() {
	return createHtmlPipeline(paths.main_html.input, paths.main_html.output);
});

// Build primary jade files
gulp.task('build:jade', ['clean:dist'], function() {
	return createJadePipeline(paths.main_html.inputJade, paths.main_html.output);
});

// Build partials html files
gulp.task('build:partials', ['clean:dist'], function() {
	return createHtmlPipeline(paths.partials.input, paths.partials.output);
});

// Build partials jade files
gulp.task('build:partials-jade', ['clean:dist'], function() {
	return createJadePipeline(paths.partials.inputJade, paths.partials.output);
});

// Remove pre-existing content from output and test folders
gulp.task('clean:dist', function () {
	del.sync([
		paths.output + '**/*'
	]);
});

// Run some unit tests to check key logic
gulp.task('tests', function() {
	return gulp.src(paths.tests.unit.input)
		.pipe(plg.traceur())
		.pipe(gulp.dest(os.tmpdir()))
		.pipe(plg.jasmine());
});

// Automatically install all bower dependencies
gulp.task('bower', function() {
	return plg.bower();
});

gulp.task('livereload', ['compile'], function() {
	return gulp.src(paths.main_html.inputJade)
		.pipe(plg.livereload());
});

/**
 * Task Runners
 */

gulp.task('set-production', function () {
	config.isProduction = true;
});

var compileSteps = ['clean:dist',
		'build:html',
		'build:jade',
		'build:partials',
		'build:partials-jade',
		'build:translations',
		'copy:static',
		'copy:images',
		'copy:fonts',
		'copy:vendor',
		'build:styles'
	]
	.concat(scriptBuildSteps);

// Compile files
gulp.task('compile', compileSteps);

gulp.task('default', [
	'bower',
	'tests'
], function() {
	// we can start compile only after we do have bower dependencies
	gulp.start('compile');

	// warning:
	// we do this only once and only in the first gulp process(can be up to 2 due to gulpfile.js reloading)
	// if we do reload gulp later all watching tasks will be handled by the first process anyway

	// watch for source changes
	gulp.watch(paths.input).on('change', function(file) {
		gulp.start('compile');
		gulp.start('livereload');
	});

	// start livereload server
	plg.livereload.listen({
		host: config.livereloadListenAddress,
		port: config.livereloadListenPort
	});

	// start local http server
	serve();
});

gulp.task('serve', function () {
	serve();
});

gulp.task('develop', [
	'bower',
	'tests'
], function() {
	// we can start compile only after we do have bower dependencies
	gulp.start('compile');
});

gulp.task('production', [
	'set-production',
	'bower',
	'tests'
], function() {
	// we can start compile only after we do have bower dependencies
	gulp.start('compile');
});