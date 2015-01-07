// system
var fs = require('fs');
var del = require('del');
var path = require('path');
var serve = require('./serve');
var spawn = require('child_process').spawn;

// General
var gulp = require('gulp');
var traceur = require('gulp-traceur');
var lazypipe = require('lazypipe');
var plumber = require('gulp-plumber');
var flatten = require('gulp-flatten');
var tap = require('gulp-tap');
var rename = require('gulp-rename');
var header = require('gulp-header');
var footer = require('gulp-footer');
var watch = require('gulp-watch');
var package = require('./package.json');
var plg = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'gulp.*'],
	replaceString: /\bgulp[\-.]/
});

// Scripts and tests
var ngAnnotate = require('gulp-ng-annotate');
var jshint = require('gulp-jshint');
var jshintStylish = require('jshint-stylish');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var karma = require('gulp-karma');
var include = require('gulp-include');
var less = require('gulp-less');

// SVGs
var svgmin = require('gulp-svgmin');
var svgstore = require('gulp-svgstore');

// Docs
var markdown = require('gulp-markdown');
var fileinclude = require('gulp-file-include');


var paths = require('./gulp/paths');
var config = require('./gulp/config');
var appsCache = {};
var appsCacheMin = {};

var childProcess = null;
var args = process.argv.slice(2);

/**
 * Gulp Taks
 */


// process angular.js applications without their 3rd party dependencies
// here we apply such special stuff as ng annotate, traceur - etc
// i.e. build steps specific to our code

gulp.task('build:apps', ['clean:dist', 'lint:scripts'], function() {
	var prodPipeline = lazypipe()
		.pipe(uglify)
		.pipe(tap, function (file, t) {
			appsCacheMin[file.relative] = file.contents;
		});

	return gulp.src(paths.scripts.inputApps)
		.pipe(include())
		.pipe(traceur())
		.pipe(ngAnnotate())
		.pipe(tap(function (file, t) {
			appsCache[file.relative] = file.contents;
		}))
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop());
});

gulp.task('build:scripts', ['clean:dist', 'lint:scripts', 'build:apps'], function() {
	var prodPipeline = lazypipe()
		.pipe(plg.gzip)
		.pipe(gulp.dest, paths.scripts.output);

	return gulp.src(paths.scripts.input)
		.pipe(plumber())
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
		.pipe(include())
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
		.pipe(plumber())
		.pipe(jshint({
			esnext: true,
			noyield: true
		}))
		.pipe(jshint.reporter(jshintStylish))
		.pipe(jshint.reporter('fail'));
});

// Process, lint, and minify less files
gulp.task('build:styles', ['clean:dist'], function() {
	var prodPipeline = lazypipe()
		.pipe(plg.minifyCss, {
			keepSpecialComments: 0
		})
		//.pipe(header, config.banner.min, { package : package })
		.pipe(rename, { suffix: '.min' })
		.pipe(gulp.dest, paths.styles.output)
		.pipe(plg.gzip)
		.pipe(gulp.dest, paths.styles.output);

	return gulp.src(paths.styles.input)
		.pipe(plumber())
		.pipe(less())
		.pipe(flatten())
		.pipe(plg.autoprefixer('last 2 version', '> 1%'))
		//.pipe(header(config.banner.full, { package : package }))
		.pipe(gulp.dest(paths.styles.output))
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop());
});

// Generate SVG sprites
gulp.task('build:svgs', ['clean:dist'], function () {
	return gulp.src(paths.svgs.input)
		.pipe(plumber())
		.pipe(tap(function (file, t) {
			if ( file.isDirectory() ) {
				var name = file.relative + '.svg';
				return gulp.src(file.path + '/*.svg')
					.pipe(svgmin())
					.pipe(svgstore({
						fileName: name,
						prefix: 'icon-',
						inlineSvg: true
					}))
					.pipe(gulp.dest(paths.svgs.output));
			}
		}))
		.pipe(svgmin())
		.pipe(svgstore({
			fileName: 'icons.svg',
			prefix: 'icon-',
			inlineSvg: true
		}))
		.pipe(gulp.dest(paths.svgs.output));
});

// Copy static files into output folder
gulp.task('copy:vendor', ['clean:dist'], function() {
	return gulp.src(paths.vendor.input)
		.pipe(plumber())
		.pipe(gulp.dest(paths.vendor.output));
});

// Copy images into output folder
gulp.task('copy:imgs', ['clean:dist'], function() {
	return gulp.src(paths.img.input)
		.pipe(plumber())
		.pipe(gulp.dest(paths.img.output));
});

// Copy fonts into output folder
gulp.task('copy:fonts', ['clean:dist'], function() {
	return gulp.src(paths.fonts.input)
		.pipe(plumber())
		.pipe(gulp.dest(paths.fonts.output));
});

// Copy static files into output folder
gulp.task('copy:static', ['clean:dist'], function() {
	return gulp.src(paths.staticFiles)
		.pipe(plumber())
		.pipe(gulp.dest(paths.output));
});

// Remove prexisting content from output and test folders
gulp.task('clean:dist', function () {
	del.sync([
		paths.output + '**/*',
		paths.test.coverage,
		paths.test.results
	]);
});

// Run unit tests
gulp.task('test:scripts', function() {
	return gulp.src([paths.test.input].concat([paths.test.spec]))
		.pipe(plumber())
		.pipe(karma({ configFile: paths.test.karma }))
		.on('error', function(err) { throw err; });
});

// Generate documentation
gulp.task('build:docs', ['compile', 'clean:docs'], function() {
	return gulp.src(paths.docs.input)
		.pipe(plumber())
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file'
		}))
		.pipe(tap(function (file, t) {
			if ( /\.md|\.markdown/.test(file.path) ) {
				return t.through(markdown);
			}
		}))
		.pipe(header(fs.readFileSync(paths.docs.templates + '/_header.html', 'utf8')))
		.pipe(footer(fs.readFileSync(paths.docs.templates + '/_footer.html', 'utf8')))
		.pipe(gulp.dest(paths.docs.output));
});

// Copy distribution files to docs
gulp.task('copy:dist', ['compile', 'clean:docs'], function() {
	return gulp.src(paths.output + '/**')
		.pipe(plumber())
		.pipe(gulp.dest(paths.docs.output + '/dist'));
});

// Copy documentation assets to docs
gulp.task('copy:assets', ['clean:docs'], function() {
	return gulp.src(paths.docs.assets)
		.pipe(plumber())
		.pipe(gulp.dest(paths.docs.output + '/assets'));
});

// Remove prexisting content from docs folder
gulp.task('clean:docs', function () {
	return del.sync(paths.docs.output);
});

// Reload gulp on file change
gulp.task('gulp-reload', function() {
	if (childProcess)
		childProcess.kill();

	var target = (args[0] ? args[0] : 'default') + '-reload';
	childProcess = spawn('gulp', [target], {stdio: 'inherit'});
});

var createHtmlPipeline = function (input, output) {
	var prodPipeline =  lazypipe()
		.pipe(plg.minifyHtml, {
			empty: true
		})
		.pipe(rename, { suffix: '.min' })
		.pipe(gulp.dest, output)
		.pipe(plg.gzip)
		.pipe(gulp.dest, output);

	return gulp.src(input)
		.pipe(plumber())
		.pipe(fileinclude())
		.pipe(gulp.dest(output))
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop());
};

var createJadePipeline = function (input, output) {
	var prodPipeline =  lazypipe()
		.pipe(plg.minifyHtml, {
			empty: true
		})
		.pipe(rename, { suffix: '.min' })
		.pipe(gulp.dest, output)
		.pipe(plg.gzip)
		.pipe(gulp.dest, output);

	return gulp.src(input)
		.pipe(plumber())
		.pipe(plg.jade())
		.pipe(fileinclude())
		.pipe(gulp.dest(output))
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop());
};

gulp.task('livereload', ['compile'], function() {
	return gulp.src(paths.main_html.input)
		.pipe(plg.livereload());
});

gulp.task('build:html', function() {
	return createHtmlPipeline(paths.main_html.input, paths.main_html.output);
});

gulp.task('build:jade', function() {
	return createJadePipeline(paths.main_html.inputJade, paths.main_html.output);
});

gulp.task('build:partials', function() {
	return createHtmlPipeline(paths.partials.input, paths.partials.output);
});

gulp.task('build:partials-jade', function() {
	return createJadePipeline(paths.partials.inputJade, paths.partials.output);
});

/**
 * Task Runners
 */

gulp.task('set-production', function () {
	config.isProduction = true;
});

var compileTasks = [
	'clean:dist',
	'build:html',
	'build:jade',
	'build:partials',
	'build:partials-jade',
	'copy:static',
	'copy:imgs',
	'copy:fonts',
	'copy:vendor',
	'build:scripts',
	// 'build:svgs',
	'build:styles'
];

// Compile files
gulp.task('compile', compileTasks);

// Generate documentation
 gulp.task('docs', [
// 	'clean:docs',
// 	'build:docs',
// 	'copy:dist',
// 	'copy:assets'
]);

// Generate documentation
// gulp.task('tests', [
// 	'test:scripts'
// ]);

gulp.task('default', [
	'compile'
], function() {
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