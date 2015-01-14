// system
var os = require('os');
var fs = require('fs');
var del = require('del');
var path = require('path');
var spawn = require('child_process').spawn;
var toml = require('toml');
var source = require('vinyl-source-stream');
require('toml-require').install();
var lazypipe = require('lazypipe');
var filterTransform = require('filter-transform');

// General
var gulp = require('gulp');
var plg = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'gulp.*'],
	replaceString: /\bgulp[\-.]/
});

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
var config = require('./gulp/config');

// Global variables
var childProcess = null;
var args = process.argv.slice(2);



/**
 * Gulp Taks
 */

gulp.task('build:scripts:vendor', ['clean:dist', 'lint:scripts'], function() {
	return gulp.src(paths.scripts.inputDeps)
		.pipe(plg.plumber())
		.pipe(plg.tap(function (file, t) {
			var config = toml.parse(file.contents);
			var dependencies = [];

			for(var i = 0; i < config.application.dependencies.length; i++)
				dependencies.push(paths.scripts.inputAppsFolder + config.application.dependencies[i]);

			var newName = file.relative.replace('.toml', '-vendor.js');

			return gulp.src(dependencies)
				.pipe(plg.concat(newName))
				.pipe(gulp.dest(paths.scripts.output));
		}))
		.pipe(gulp.dest(paths.scripts.output));
});

var browserifyBundle = function(filename) {
	var browserifyPipeline = browserify(filename, {
		basedir: __dirname
	})
		.add(es6ify.runtime)
		.transform(es6ify)
		.transform(bulkify)
		.transform(brfs);
	if (config.isProduction) {
		browserifyPipeline = browserifyPipeline
			.transform(ngminify)
			.transform(uglifyify);
	}
	return browserifyPipeline
		.bundle()
		.pipe(source(path.basename(filename)))
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
			noyield: true
		}))
		.pipe(plg.jshint.reporter(plg.jshintStylish))
		.pipe(plg.jshint.reporter('fail'));
});

// Process, lint, and minify less files
gulp.task('build:styles', ['clean:dist'], function() {
	var prodPipeline = lazypipe()
		.pipe(plg.minifyCss, {
			keepSpecialComments: 0
		})
		//.pipe(header, config.banner.min, { package : package })
		.pipe(plg.rename, { suffix: '.min' })
		.pipe(plg.sourcemaps.write, '.')
		.pipe(gulp.dest, paths.styles.output)
		.pipe(plg.gzip)
		.pipe(gulp.dest, paths.styles.output);

	return gulp.src(paths.styles.input)
		.pipe(plg.plumber())
		.pipe(plg.sourcemaps.init())
		.pipe(plg.less())
		.pipe(plg.autoprefixer('last 2 version', '> 1%'))
		//.pipe(header(config.banner.full, { package : package }))
		.pipe(plg.sourcemaps.write('.'))
		.pipe(gulp.dest(paths.styles.output))
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop());
});

// Copy static files into output folder
gulp.task('copy:vendor', ['clean:dist'], function() {
	return gulp.src(paths.vendor.input)
		.pipe(plg.plumber())
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
		.pipe(plg.fileInclude())
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

// Reload gulp on file change
gulp.task('gulp-reload', function() {
	if (childProcess)
		childProcess.kill();

	var target = (args[0] ? args[0] : 'default') + '-reload';
	childProcess = spawn('gulp', [target], {stdio: 'inherit'});
});

gulp.task('livereload', ['compile'], function() {
	return gulp.src(paths.main_html.input)
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

	// watch for gulpfile changes
	gulp.watch('gulpfile.js', ['gulp-reload']);

	// start livereload server
	plg.livereload.listen({
		host: config.livereloadListenAddress,
		port: config.livereloadListenPort
	});

	// start local http server
	serve();
});

gulp.task('default-reload', [
	'compile'
]);

gulp.task('production', [
	'set-production',
	'compile'
]);

gulp.task('production-reload', [
	'set-production',
	'compile'
]);
