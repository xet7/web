const gulp = global.gulp;
const plg = global.plg;

const karma = require('karma').server;
const os = require('os');
const fs = require('fs');
const del = require('del');
const lazypipe = require('lazypipe');

// Global variables
const args = process.argv.slice(2);
let plumber = null;
let isServe = false;
let isWatching = args.length < 1;
let manifest = {};

// Modules
const serve = require('./serve');
const utils = require('./gulp/utils');

// Configuration
const config = require('./gulp/config');
const paths = require('./gulp/paths');
let sharedEnvironment = {
	_: 'purge',
	API_URI: process.env.API_URI ? process.env.API_URI : config.defaultApiUri,
	ROOT_DOMAIN: process.env.ROOT_DOMAIN ? process.env.ROOT_DOMAIN : config.defaultRootDomain
};

if (!isWatching) {
	plumber = plg.util.noop;
	if (args[0] === 'production') {
		console.log('Making a production build...');
		config.isProduction = true;
		sharedEnvironment.IS_PRODUCTION = true;
	} else
		sharedEnvironment.IS_PRODUCTION = '';

	if (args[0] === 'serve') {
		isServe = true;
	}
} else {
	plumber = plg.plumber;
	isServe = true;
}

global.plumber = plumber;
global.sharedEnvironment = sharedEnvironment;
const Pipelines = require('./gulp/pipelines');
const pipelines = new Pipelines(manifest, plumber, isWatching);
global.pipelines = pipelines;

const plugins = require('./gulp/plugins');
gulp.task('build:plugins', plugins());


/**
 * Gulp Taks
 */

// Lint scripts
gulp.task('lint:scripts',  gulp.series(
	() => pipelines.lintScripts(paths.scripts.inputAll)
));

// Process, lint, and minify less files
gulp.task('build:styles', () => {
	let prodPipeline = lazypipe()
		.pipe(plg.minifyCss, {
			keepSpecialComments: 0
		})
		.pipe(plg.tap, pipelines.revTap(paths.styles.output));

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
		// oh yes, gulp is full of hacks and totally weird behavior
		// the special solution for the special gulp-less plugin
		.pipe(isWatching ? plg.less().on('error', function (err) {
			utils.logGulpError('Less error', 'gulpfile.js', err);
			this.emit('end');
		}) : plg.less())
		.pipe(plg.autoprefixer('last 2 version', '> 1%'))
		.pipe(config.isDebugable && !config.isProduction ? plg.sourcemaps.write('.') : plg.util.noop())
		.pipe(!config.isProduction ? gulp.dest(paths.styles.output) : plg.util.noop())
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop())
		.pipe(pipelines.livereloadPipeline()());
});

// Copy images into output folder
gulp.task('copy:images', () =>
	gulp.src(paths.img.input)
		.pipe(plumber())
		.pipe(gulp.dest(paths.img.output))
		.pipe(pipelines.livereloadIndexPipeline()())
);

// Copy fonts into output folder
gulp.task('copy:fonts', () =>
	gulp.src(paths.fonts.input)
		.pipe(plumber())
		.pipe(gulp.dest(paths.fonts.output))
		.pipe(pipelines.livereloadIndexPipeline()())
);

// Build primary markup jade files
gulp.task('build:jade', () => pipelines.createJadePipeline(paths.markup.input, paths.markup.output, false));

// Remove pre-existing content from output and test folders
gulp.task('clean', cb => {
	utils.def(() => del.sync([
		'./' + paths.output + '**/*',
		'./' + paths.cache + '**/*'
	]));

	utils.def(() => fs.mkdirSync('./' + paths.output));
	utils.def(() => fs.mkdirSync('./' + paths.translations.output));
	utils.def(() => fs.mkdirSync('./' + paths.plugins));
	utils.def(() => fs.mkdirSync('./' + paths.cache));
	utils.def(() => fs.mkdirSync('./' + paths.scripts.output));

	cb(null);
});

// Serve it, baby!
gulp.task('serve', cb => {
	if (isServe) {
		serve();
		isServe = false;
	}

	cb(null);
});

/**
 * Task Runners
 */
let coreAppBundles = {};

const compileSteps = [
	'copy:images',
	'copy:fonts',
	'build:styles'
];

// Write manifest paths into external file(assets translation see revTap)
gulp.task('persists:paths', cb => {
	fs.writeFileSync('paths.json', JSON.stringify(manifest, null, 4));
	cb(null);
});

// Got run when primary compilation finished
gulp.task('compile:finished', gulp.series(
	'persists:paths', 'build:jade', 'serve'
));

//gulp.task('compile:script', gulp.parallel(
//	'build:plugins', 'copy:vendor', 'build:scripts:vendor'
//));

// Compile files
gulp.task('compile', gulp.series(
	gulp.parallel('lint:scripts'),
	//'tests',
	gulp.parallel(compileSteps),
	'compile:finished'
));

gulp.task('tests:integration', (cb) =>
	karma.start({
		configFile: __dirname + '/karma-integration.conf.js',
		singleRun: true
	}, cb)
);

gulp.task('tests:unit', (cb) =>
	karma.start({
		configFile: __dirname + '/karma-unit.conf.js',
		singleRun: true
	}, cb)
);

gulp.task('tests:all', gulp.parallel('lint:scripts', 'tests:integration', 'tests:unit'));

let startingTasks = gulp.series(gulp.parallel('clean'), 'build:plugins', 'compile');

/*
	Gulp primary tasks
 */

gulp.task('default', gulp.series(
	startingTasks,
	cb => {
		// live reload for everything except browserify(as we use watchify)
		gulp.watch(paths.img.input, gulp.series('copy:images'));
		gulp.watch(paths.fonts.input, gulp.series('copy:fonts'));
		gulp.watch(paths.styles.inputAll, gulp.series('build:styles'));
		gulp.watch(paths.markup.input, gulp.series('build:jade'));
		//gulp.watch(paths.translations.input, gulp.series('build:translations'));

		// start livereload server
		plg.livereload.listen({
			host: config.livereloadListenAddress,
			port: config.livereloadListenPort
		});

		cb(null);
	}
));

gulp.task('develop', startingTasks);

gulp.task('production', startingTasks);

//should build translation as well because they are injected direct to sources
gulp.task('tests', gulp.series('build:plugins', 'tests:all'));

// woa!