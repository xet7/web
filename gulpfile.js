// system
var fs = require('fs');
var del = require('del');
var path = require('path');
var spawn = require('child_process').spawn;
var toml = require('toml');
var lazypipe = require('lazypipe');

// General
var gulp = require('gulp');
var traceur = require('gulp-traceur');
var plg = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'gulp.*'],
	replaceString: /\bgulp[\-.]/
});

// Modules
var serve = require('./serve');

// Configuration
var package = require('./package.json');
var paths = require('./gulp/paths');
var config = require('./gulp/config');

// Global variables
var childProcess = null;
var args = process.argv.slice(2);
var appsCache = {};
var appsCacheMin = {};



/**
 * Gulp Taks
 */



// process angular.js applications without their 3rd party dependencies
// here we apply such special stuff as ng annotate, traceur - etc
// i.e. build steps specific to our code

gulp.task('build:apps', ['clean:dist', 'lint:scripts'], function() {
	var prodPipeline = lazypipe()
		.pipe(plg.uglify)
		.pipe(plg.tap, function (file, t) {
			appsCacheMin[file.relative] = file.contents;
		});

	return gulp.src(paths.scripts.inputApps)
		.pipe(plg.cached('build:apps'))
		.pipe(plg.include())
		.pipe(traceur())
		.pipe(plg.ngAnnotate())
		.pipe(plg.tap(function (file, t) {
			appsCache[file.relative] = file.contents;
		}))
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop());
});

gulp.task('build:scripts', ['clean:dist', 'lint:scripts', 'build:apps', 'build:translations'], function() {
	var prodPipeline = lazypipe()
		.pipe(plg.gzip)
		.pipe(gulp.dest, paths.scripts.output);

	return gulp.src(paths.scripts.input)
		.pipe(plg.plumber())
		.pipe(plg.replace(/require "(.*).js"/g, function(match, p1, p2, p3, offset, string) {
			var file = p1 + (config.isProduction ? '.min.js' : '.js');
			var resolvedFile = path.resolve(__dirname, path.dirname(paths.scripts.input), file);
			if (fs.existsSync(resolvedFile))
				return 'require "' + file + '"';

			if (config.isProduction) {
				file = p1 + '.js';
				resolvedFile = path.resolve(__dirname, path.dirname(paths.scripts.input), file);
				if (fs.existsSync(resolvedFile))
					return 'require "' + file + '"';
			}

			return 'console.error("Cannot find angular.js include \\"' + file + '\\"!")';
		}))
		.pipe(plg.include())
		.pipe(plg.replace(/\/\/\s*=\s*require-application "(.*).js"/g, function(match, p1, p2, p3, offset, string) {
			var key = p1 + '.js';
			var cache = config.isProduction ? appsCacheMin : appsCache;

			if (!cache[key])
				return 'console.error("Cannot find angular.js application \\"' + key + '\\"!")';
			return cache[key];
		}))
		//.pipe(header(config.banner.full, { package : package }))
		.pipe(gulp.dest(paths.scripts.output))
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop());
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
		.pipe(gulp.dest, paths.styles.output)
		.pipe(plg.gzip)
		.pipe(gulp.dest, paths.styles.output);

	return gulp.src(paths.styles.input)
		.pipe(plg.plumber())
		.pipe(plg.less())
		.pipe(plg.autoprefixer('last 2 version', '> 1%'))
		//.pipe(header(config.banner.full, { package : package }))
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

var createHtmlPipeline = function (input, output) {
	var prodPipeline =  lazypipe()
		.pipe(plg.minifyHtml, {
			empty: true
		})
		.pipe(plg.rename, { suffix: '.min' })
		.pipe(gulp.dest, output)
		.pipe(plg.gzip)
		.pipe(gulp.dest, output);

	return gulp.src(input)
		.pipe(plg.plumber())
		.pipe(plg.fileInclude())
		.pipe(gulp.dest(output))
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop());
};

var createJadePipeline = function (input, output) {
	var prodPipeline =  lazypipe()
		.pipe(plg.minifyHtml, {
			empty: true
		})
		.pipe(plg.rename, { suffix: '.min' })
		.pipe(gulp.dest, output)
		.pipe(plg.gzip)
		.pipe(gulp.dest, output);

	return gulp.src(input)
		.pipe(plg.plumber())
		.pipe(plg.jade())
		.pipe(plg.fileInclude())
		.pipe(gulp.dest(output))
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop());
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
		paths.output + '**/*',
		paths.test.coverage,
		paths.test.results
	]);
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

// Compile files
gulp.task('compile', [
	'clean:dist',
	'build:html',
	'build:jade',
	'build:partials',
	'build:partials-jade',
	'build:translations',
	'copy:static',
	'copy:images',
	'copy:fonts',
	'copy:vendor',
	'build:scripts',
	'build:styles'
]);

gulp.task('default', [
	'bower'
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
