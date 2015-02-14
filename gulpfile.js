var gulp = require('gulp');
var plg = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'gulp.*'],
	replaceString: /\bgulp[\-.]/
});
global.plg = plg;
var s = require('underscore.string');

var utils = require('./gulp/utils');
var config = require('./gulp/config');
var semver = require('semver');

if (!semver.satisfies(process.version, config.nodeVersion)) {
	utils.logGulpError('Incompatible node.js version\n', 'gulpfile.js', new Error('This gulpfile requires node.js version ' + config.nodeVersion + '. ' + process.version + ' is currently used.'));
	return;
}

if (!process.env.API_URI)
	process.env.API_URI = config.defaultApiUri;
if (!process.env.TLD)
	process.env.TLD = config.defaultRootDomain;

// system
var crypto = require('crypto');
var os = require('os');
var fs = require('fs');
var del = require('del');
var path = require('path');
var toml = require('toml');
var source = require('vinyl-source-stream');
var lazypipe = require('lazypipe');
var domain = require('domain');

var to5 = require('gulp-6to5');

// Browserify the mighty one
var browserify = require('browserify'),
	to5ify = require('6to5ify'),
	browserifyNgAnnotate = require('browserify-ngannotate'),
	bulkify = require('bulkify'),
	uglifyify = require('uglifyify'),
	stripify = require('stripify'),
	envify = require('envify'),
	brfs = require('brfs');

// Modules
var serve = require('./serve');

// Configuration
var paths = require('./gulp/paths');

var filterTransform = require('filter-transform');

// Global variables
var args = process.argv.slice(2);

var plumber = null;
var isServe = false;
process.env.IS_PRODUCTION = false;
if (args.length > 0) {
	plumber = plg.util.noop;
	if (args[0] === 'production') {
		console.log('Making a production build...');
		config.isProduction = true;
		process.env.IS_PRODUCTION = true;
	}
} else {
	plumber = plg.plumber;
	isServe = true;
}

require('toml-require').install();

/**
 * Reused pipelines
 */

var livereloadPipeline  = function (isForce) {
	if (!isForce)
		isForce = false;

	return config.isProduction || (!isForce && !isPartialLivereloadBuild)
		? lazypipe()
			.pipe(plg.util.noop)
		: lazypipe()
			.pipe(plg.ignore.exclude, '*.map')
			.pipe(plg.livereload);
};

var prodHtmlPipeline  = function (input, output) {
	return lazypipe()
		.pipe(plg.sourcemaps.init)
		.pipe(plg.angularTemplatecache, {root: output.split('/').filter(function (p) {return !!p}).slice(-1)[0], standalone: true})
		.pipe(plg.uglify)
		.pipe(plg.tap, revTap(paths.scripts.output))
		.pipe(plg.sourcemaps.write, '.')
		.pipe(gulp.dest, paths.scripts.output);
};

var createJadePipeline = function (input, output, isTemplateCache) {
	return gulp.src(input)
		.pipe(plumber())
		.pipe(config.isProduction ? plg.ignore.exclude(/.*\.test.*/) :  plg.util.noop())
		.pipe(plg.ignore.exclude(/\/_.*/))
		.pipe(plg.jade({
			locals: {
				fs: fs,
				resolveAsset: function(name) {
					return manifest[name] ? manifest[name] : name;
				},
				assets: manifest,
				globs: {
					isProduction: config.isProduction,
					API_URI: process.env.API_URI,
					TLD: process.env.TLD
				}
			}
		}))
		.pipe(gulp.dest(output))
		.pipe(livereloadPipeline()())
		.pipe(config.isProduction && isTemplateCache ? prodHtmlPipeline(input, output)() : plg.util.noop());
};

/**
 * Gulp Taks
 */

var manifest = {};

var revTap = function (output) {
	return function(file) {
		file.revHash = crypto.createHash('sha1').update(file.contents).digest('hex');

		var key = '/' + output.replace(paths.output, '') + path.basename(file.relative);
		var value = path.dirname(key) + '/' + path.basename(key, path.extname(key)) + '-' + file.revHash + path.extname(key);
		manifest[key] = value;

		file.path = file.path.replace(path.basename(key), path.basename(value));

		console.log('Perform manifest translation for a static asset', key, '->', value);
	};
};

gulp.task('build:scripts:vendor:min', function() {
	return gulp.src(paths.scripts.inputDeps)
		.pipe(plumber())
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
				.pipe(plumber())
				.pipe(plg.sourcemaps.init())
				.pipe(plg.ngAnnotate())
				.pipe(plg.uglify())
				.pipe(plg.sourcemaps.write('.'))
				.pipe(gulp.dest(paths.scripts.cacheOutput));
		}))
		.pipe(gulp.dest(paths.scripts.output));
});

gulp.task('build:scripts:core', function() {
	var prodPipeline = lazypipe()
		.pipe(plg.uglify)
		.pipe(plg.tap, revTap(paths.scripts.output));

	return gulp.src(paths.scripts.input)
		.pipe(plumber())
		.pipe(config.isDebugable ? plg.sourcemaps.init() : plg.util.noop())
		.pipe(to5())
		.pipe(config.isLogs ? plg.util.noop() : plg.stripDebug())
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop())
		.pipe(config.isDebugable ? plg.sourcemaps.write('.') : plg.util.noop())
		.pipe(gulp.dest(paths.scripts.output));
});

gulp.task('build:scripts:vendor', ['build:scripts:vendor:min', 'build:scripts:core'], function() {
	return gulp.src(paths.scripts.inputDeps)
		.pipe(plumber())
		.pipe(plg.tap(function (file, t) {
			var appConfig = toml.parse(file.contents);
			var dependencies = [];

			for(var i = 0; i < appConfig.application.dependencies.length; i++) {
				var resolvedFileOriginal = paths.scripts.inputAppsFolder + appConfig.application.dependencies[i];

				var resolvedFile = '';

				if (config.isProduction && resolvedFileOriginal.indexOf('browser-polyfill.js') < 0 && !s(resolvedFileOriginal).endsWith('min.js')) {
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
				.pipe(plumber())
				.pipe(plg.sourcemaps.init())
				.pipe(plg.concat(newName))
				.pipe(config.isProduction ? plg.tap(revTap(paths.scripts.output)) : plg.util.noop())
				.pipe(plg.sourcemaps.write('.'))
				.pipe(gulp.dest(paths.scripts.output));
		}))
		.pipe(gulp.dest(paths.scripts.output))
});

var browserifyBundle = function(filename) {
	var basename = path.basename(filename);

	return gulp.src(filename, {read: false})
		.pipe(plg.tap(function (file){
			var d = domain.create();

			d.on("error", function(err) {
				utils.logGulpError('Browserify compile error:', file.path, err);
			});

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
					.transform(ownCodebaseTransform(to5ify))
					.transform(ownCodebaseTransform(bulkify))
					.transform(ownCodebaseTransform(envify))
					.transform(ownCodebaseTransform(brfs));

				if (!config.isLogs) {
					browserifyPipeline = browserifyPipeline
						.transform(stripify);
				}

				if (config.isProduction) {
					browserifyPipeline = browserifyPipeline
						.transform(ownCodebaseTransform(browserifyNgAnnotate))
						.transform(uglifyify);
				}

				file.contents = browserifyPipeline
					.bundle();
			});
		}))
		.pipe(plg.streamify(plg.concat(basename)))
		.pipe(plg.buffer())
		.pipe(config.isProduction ? plg.tap(revTap(paths.scripts.output)) : plg.util.noop())
		.pipe(gulp.dest(paths.scripts.output));
};

var scriptBuildSteps = [];

paths.scripts.inputApps.forEach(function(appScript){
	var name = 'build:scripts-' + (scriptBuildSteps.length + 1);

	gulp.task(name, ['build:translations', 'build:scripts:vendor'], function() {
		return browserifyBundle(appScript);
	});
	scriptBuildSteps.push(name);
});

// Lint scripts
gulp.task('lint:scripts', function () {
	return gulp.src(paths.scripts.inputAll)
		.pipe(plumber())
		.pipe(plg.cached('lint:scripts'))
		.pipe(plg.tap(function(file, t){
			console.log('Linting: "' + file.relative + '" ...');
		}))
		.pipe(plg.jshint({
			esnext: true,
			noyield: true,
			indent: 4,
			maxdepth: 5,
			maxlen: 140,
			maxstatements: 50,
			newcap: true,
			noempty: true,
			nonbsp: true,
			nonew: true,
			quotmark: 'single',
			'-W002': false,
			'-W014': false
		}))
		.pipe(plg.jshint.reporter(plg.jshintStylish))
		.pipe(plg.jshint.reporter('fail'));
});


// Process, lint, and minify less files
gulp.task('build:styles', function() {
	var prodPipeline = lazypipe()
		.pipe(plg.minifyCss, {
			keepSpecialComments: 0
		})
		.pipe(plg.tap, revTap(paths.styles.output));

	if (config.isDebugable) {
		prodPipeline = prodPipeline
			.pipe(plg.sourcemaps.write, '.');
	}

	prodPipeline = prodPipeline
		.pipe(gulp.dest, paths.styles.output)
		.pipe(plg.ignore.exclude, '*.map')
		.pipe(plg.gzip)
		.pipe(gulp.dest, paths.styles.output);

	return gulp.src(paths.styles.input)
		.pipe(plumber())
		.pipe(config.isDebugable ? plg.sourcemaps.init() : plg.util.noop())
		.pipe(plg.less())
		.pipe(plg.autoprefixer('last 2 version', '> 1%'))
		.pipe(config.isDebugable && !config.isProduction ? plg.sourcemaps.write('.') : plg.util.noop())
		.pipe(!config.isProduction ? gulp.dest(paths.styles.output) : plg.util.noop())
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop())
		.pipe(livereloadPipeline()());
});

// Copy static files into output folder
gulp.task('copy:vendor', function() {
	return gulp.src(paths.vendor.input, {read: false})
		.pipe(plumber())
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
gulp.task('copy:images', function() {
	return gulp.src(paths.img.input)
		.pipe(plumber())
		.pipe(gulp.dest(paths.img.output));
});

// Copy fonts into output folder
gulp.task('copy:fonts', function() {
	return gulp.src(paths.fonts.input)
		.pipe(plumber())
		.pipe(gulp.dest(paths.fonts.output));
});

// Copy static files into output folder
gulp.task('copy:static', function() {
	return gulp.src(paths.staticFiles)
		.pipe(plumber())
		.pipe(gulp.dest(paths.output));
});

// Build translation files(toml -> json)
gulp.task('build:translations', function() {
	return gulp.src(paths.translations.input)
		.pipe(plumber())
		.pipe(plg.toml({to: JSON.stringify, ext: '.json'}))
		.pipe(gulp.dest(paths.translations.output));
});

// Build primary markup jade files
gulp.task('build:jade', function() {
	return createJadePipeline(paths.markup.input, paths.markup.output, false);
});

// Build partials markup jade files
gulp.task('build:partials-jade', function() {
	return createJadePipeline(paths.partials.input, paths.partials.output, true);
});

// Remove pre-existing content from output and test folders
gulp.task('clean', function () {
	del.sync([
		paths.output + '**/*',
		paths.cache + '**/*'
	]);
	try {
		fs.mkdirSync(paths.output);
	} catch (e) { }
	try {
		fs.mkdirSync(paths.cache);
	} catch (e) { }
});

// Run some unit tests to check key logic
gulp.task('tests', function() {
	return gulp.src(paths.tests.unit.input)
		.pipe(plumber())
		.pipe(to5())
		.pipe(gulp.dest(os.tmpdir()))
		.pipe(plg.jasmine());
});

// Automatically install all bower dependencies
gulp.task('bower', function() {
	return plg.bower();
});

/**
 * Task Runners
 */

var compileSteps = [
		//'build:jade',
		'build:partials-jade',
		'build:translations',
		'copy:static',
		'copy:images',
		'copy:fonts',
		'copy:vendor',
		'build:styles'
	]
	.concat(scriptBuildSteps);

gulp.task('compile:finished', compileSteps, function() {
	fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 4));

	gulp.start(['build:jade', 'lr']);
});

gulp.task('lr', ['build:jade'], function () {
	if (!isFirstBuild) {
		return gulp.src(paths.markup.input)
			.pipe(livereloadPipeline(true)());
	}
	isFirstBuild = false;
});

// Compile files
gulp.task('compile', ['clean', 'tests', 'lint:scripts'], function() {
	// start local http server
	if (isServe) {
		serve();
		isServe = false;
	}

	gulp.start(compileSteps.concat(['compile:finished']));
});

// black magic to fix multiple and inconsistent live reloads, the simplest possible way
var scheduledTimeout = null;
var isPartialLivereloadBuild = false;
var isFirstBuild = true;
var scheduleLiveReloadBuildTaskStart = function (taskName, timeout) {
	if (!timeout)
		timeout = 500;

	if (taskName != 'compile')
		isPartialLivereloadBuild = true;

	console.warn('live reload build scheduled for ' + taskName + ' in ' + timeout + 'ms.');
	if (scheduledTimeout) {
		clearTimeout(scheduledTimeout);
		taskName = 'compile';
		isPartialLivereloadBuild = false;
		console.warn('live reload conflict - perform full rebuild');
	}
	scheduledTimeout = setTimeout(function (){
		scheduledTimeout = null;
		console.warn('perform live reload build for ' + taskName);
		gulp.start(taskName);
	}, timeout);
};

gulp.task('default', [
	'bower'
], function() {
	// we can start compile only after we do have bower dependencies
	gulp.start('compile');
	
	// watch for source changes and rebuild the whole project with _exceptions_
	gulp.watch([paths.input, '!' + paths.styles.inputAll, '!' + paths.markup.input, '!' + paths.partials.input]).on('change', function(file) {
		isPartialLivereloadBuild = false;
		scheduleLiveReloadBuildTaskStart('compile');
	});
	
	// _exceptions_
	
	// partial live-reload for style changes
	gulp.watch(paths.styles.inputAll).on('change', function(file) {
		scheduleLiveReloadBuildTaskStart('build:styles');
	});

	// partial live-reload for primary jade files
	gulp.watch(paths.markup.input).on('change', function(file) {
		scheduleLiveReloadBuildTaskStart('build:jade');
	});

	// partial live-reload for partials jade files
	gulp.watch(paths.partials.input).on('change', function(file) {
		scheduleLiveReloadBuildTaskStart('build:partials-jade');
	});

	// start livereload server
	plg.livereload.listen({
		host: config.livereloadListenAddress,
		port: config.livereloadListenPort
	});
});

gulp.task('serve', function () {
	serve();
});

gulp.task('develop', [
	'bower'
], function() {
	// we can start compile only after we do have bower dependencies
	gulp.start('compile');
});

gulp.task('production', [
	'bower'
], function() {
	// we can start compile only after we do have bower dependencies
	gulp.start('compile');
});