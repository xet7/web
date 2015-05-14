const gulp = global.gulp;
const plg = global.plg;

let co = require('co');
let crypto = require('crypto');
let os = require('os');
let fs = require('fs');
let del = require('del');
let path = require('path');
let toml = require('toml');
let source = require('vinyl-source-stream');
let lazypipe = require('lazypipe');
let domain = require('domain');
let filterTransform = require('filter-transform');

// Browserify the mighty one
let browserify = require('browserify'),
	babelify = require('babelify'),
	browserifyNgAnnotate = require('browserify-ngannotate'),
	bulkify = require('bulkify'),
	uglifyify = require('uglifyify'),
	stripify = require('stripify'),
	envify = require('envify'),
	watchify = require('watchify'),
	brfs = require('brfs'),
	exorcist = require('exorcist');

// Global variables
let args = process.argv.slice(2);
let plumber = null;
let isServe = false;
let isWatching = args.length < 1;
let manifest = {};

// Modules
let serve = require('./serve');
let utils = require('./gulp/utils');

// Configuration
let config = require('./gulp/config');
let paths = require('./gulp/paths');
if (!process.env.API_URI)
	process.env.API_URI = config.defaultApiUri;
if (!process.env.TLD)
	process.env.TLD = config.defaultRootDomain;

if (!isWatching) {
	plumber = plg.util.noop;
	if (args[0] === 'production') {
		console.log('Making a production build...');
		config.isProduction = true;
		process.env.IS_PRODUCTION = true;
	}
	if (args[0] === 'serve') {
		isServe = true;
	}
} else {
	plumber = plg.plumber;
	isServe = true;
}

const Pipelines = require('./gulp/pipelines');
const pipelines = new Pipelines(manifest, plumber);

/**
 * Gulp Taks
 */

// Build minified version of vendor libraries defined in *.toml(some libs may not have pre-bundled minified versions)
gulp.task('build:scripts:vendor:min', () =>
	gulp.src(paths.scripts.inputDeps)
		.pipe(plumber())
		.pipe(plg.tap((file, t) => {
			let appConfig = toml.parse(file.contents);
			let dependencies = [];

			for(let i = 0; i < appConfig.application.dependencies.length; i++) {
				let resolvedFileOriginal = paths.scripts.inputAppsFolder + appConfig.application.dependencies[i];

				if (fs.existsSync(resolvedFileOriginal)) {
					let resolvedFile = resolvedFileOriginal.replace('.js', '.min.js');

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
		.pipe(gulp.dest(paths.scripts.output))
);

// Build vendor libraries into a single vendor file(fancy concatenation)
gulp.task('build:scripts:vendor:normal', () =>
	gulp.src(paths.scripts.inputDeps)
		.pipe(plumber())
		.pipe(plg.tap((file, t) => {
			let appConfig = toml.parse(file.contents);
			let dependencies = [];

			for(let i = 0; i < appConfig.application.dependencies.length; i++) {
				let resolvedFileOriginal = paths.scripts.inputAppsFolder + appConfig.application.dependencies[i];

				let resolvedFile = '';

				if (config.isProduction && resolvedFileOriginal.indexOf('browser-polyfill.js') < 0 && !resolvedFileOriginal.endsWith('min.js')) {
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

				if (!fs.existsSync(resolvedFile)) {
					console.log(resolvedFile);
					throw new Error('Cannot find vendor library: "' + appConfig.application.dependencies[i] + '"');
				}

				dependencies.push(resolvedFile);
			}

			let newName = file.relative.replace('.toml', '-vendor.js');

			return gulp.src(dependencies)
				.pipe(plumber())
				.pipe(plg.sourcemaps.init())
				.pipe(plg.concat(newName))
				.pipe(config.isProduction ? plg.tap(pipelines.revTap(paths.scripts.output)) : plg.util.noop())
				.pipe(plg.sourcemaps.write('.'))
				.pipe(gulp.dest(paths.scripts.output));
		}))
		.pipe(gulp.dest(paths.scripts.output))
);

// Build vendor libraries composite task
gulp.task('build:scripts:vendor', gulp.series('build:scripts:vendor:min', 'build:scripts:vendor:normal'));

let caches = {};

// Defines generic browserify build task, one task for each item inside paths.scripts.inputApps
let browserifyBundle = filename => {
	let basename = path.basename(filename);
	let cacheFileName = './' + paths.cacheLL + basename + '.cache';
	let jsMapBasename = basename.replace('.js', '.js.map');
	utils.def(() => fs.mkdirSync('./dist/js'));

	function ownCodebaseTransform (transform) {
		return filterTransform(
				file => file.includes(path.resolve(__dirname, paths.scripts.inputFolder)),
			transform);
	}

	function bundle(b) {
		return b.bundle()
			.pipe(exorcist('./' + paths.scripts.output + jsMapBasename))
			.pipe(source(filename))
			.pipe(plg.rename({
				dirname: ''
			}))
			.pipe(plg.buffer())
			.pipe(config.isProduction ? plg.tap(pipelines.revTap(paths.scripts.output)) : plg.util.noop())
			.pipe(plg.stream())
			.pipe(gulp.dest(paths.scripts.output))
			.pipe(pipelines.livereloadPipeline()());
	}

	let c = {
		cache: {},
		packageCache: {}
	};
	let cache = c.cache;
	let packageCache = c.packageCache;

	let browserifyInstance = watchify(browserify({
		cache: cache,
		packageCache: packageCache,
		entries: filename,
		basedir: __dirname,
		debug: config.isDebugable
	}), {poll: true});

	browserifyInstance
		.transform(ownCodebaseTransform(babelify), {externalHelpers: true})
		.transform(ownCodebaseTransform(bulkify))
		.transform(ownCodebaseTransform(envify))
		.transform(ownCodebaseTransform(brfs));

	if (!config.isLogs)
		browserifyInstance
			.transform(stripify);

	if (config.isProduction)
		browserifyInstance
			.transform(ownCodebaseTransform(browserifyNgAnnotate))
			.transform(uglifyify);

	browserifyInstance
		.on('update', () => {
			console.log(`re-bundling '${filename}'...`);
			return bundle(browserifyInstance);
		})
		.on('log', msg => {
			console.log(`bundled '${filename}'`, msg);
		});

	return bundle(browserifyInstance);
};

// Lint scripts
gulp.task('lint:scripts',  gulp.series(
	() =>
		gulp.src(paths.scripts.inputAll)
			.pipe(plumber())
			.pipe(plg.cached('lint:scripts'))
			.pipe(plg.tap((file, t) =>
				console.log('Linting: "' + file.relative + '" ...')
			))
			.pipe(plg.jshint())
			.pipe(plg.jshint.reporter(plg.jshintStylish))
			.pipe(plg.jshint.reporter({
				reporter: (result, config, options) => {
					delete plg.cached.caches['lint:scripts'];
				}
			}))
			.pipe(plg.jshint.reporter('fail'))
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
		.pipe(isWatching ? plg.less().on('error', err => {
			utils.logGulpError('Less error', 'gulpfile.js', err);
			this.emit('end');
		}) : plg.less())
		.pipe(plg.autoprefixer('last 2 version', '> 1%'))
		.pipe(config.isDebugable && !config.isProduction ? plg.sourcemaps.write('.') : plg.util.noop())
		.pipe(!config.isProduction ? gulp.dest(paths.styles.output) : plg.util.noop())
		.pipe(config.isProduction ? prodPipeline() : plg.util.noop())
		.pipe(pipelines.livereloadPipeline()());
});

// Copy static files into output folder
gulp.task('copy:vendor', () =>
	gulp.src(paths.vendor.input, {read: false})
		.pipe(plumber())
		.pipe(plg.tap((file, t) => {
			if (!file.path.includes('min.js')) {
				if (config.isProduction) {
					try {
						let minifiedVersion = file.path.replace('.js', '.min.js');
						file.contents = fs.readFileSync(minifiedVersion);
					} catch (err) {
						file.contents = fs.readFileSync(file.path);
					}
				} else
					file.contents = fs.readFileSync(file.path);
			}
		}))
		.pipe(gulp.dest(paths.vendor.output))
);

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

// Build translation files(toml -> json)
gulp.task('build:translations', () =>
	gulp.src(paths.translations.input)
		.pipe(plumber())
		.pipe(plg.toml({to: JSON.stringify, ext: '.json'}))
		.pipe(gulp.dest(paths.translations.output))
		.pipe(pipelines.livereloadIndexPipeline()())
);

// Build primary markup jade files
gulp.task('build:jade', () => pipelines.createJadePipeline(paths.markup.input, paths.markup.output, false));

// Build partials markup jade files
gulp.task('build:partials-jade', () => pipelines.createJadePipeline(paths.partials.input, paths.partials.output, true));

// Remove pre-existing content from output and test folders
gulp.task('clean', cb => {
	utils.def(() =>
		del.sync([
			'./' + paths.output + '**/*',
			'./' + paths.cache + '**/*'
		])
	);

	// yea...
	utils.def(() => fs.mkdirSync('./' + paths.output));
	utils.def(() => fs.mkdirSync('./' + paths.cache));
	utils.def(() => fs.mkdirSync('./' + paths.scripts.output));

	cb(null);
});

// Run some unit tests to check key logic
gulp.task('tests', () =>
	gulp.src(paths.tests.unit.input)
		.pipe(plumber())
		.pipe(plg.babel())
		.pipe(gulp.dest(os.tmpdir()))
		.pipe(plg.jasmine())
);

// Automatically install all bower dependencies
gulp.task('bower', () => plg.bower());

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

const compileSteps = [
	'build:partials-jade',
	'build:translations',
	'copy:images',
	'copy:fonts',
	'build:styles',
	'build:translations',
	'build:scripts:vendor'
];

const scriptCompileSteps = paths.scripts.inputApps.map((appScript, i) => {
	let name = 'build:scripts-' + (i + 1);
	gulp.task(name, () => browserifyBundle(appScript));
	return name;
});

// Write manifest paths into external file(assets translation see revTap)
gulp.task('persists:paths', cb => {
	fs.writeFileSync('paths.json', JSON.stringify(manifest, null, 4));
	cb(null);
});

// Got run when primary compilation finished
gulp.task('compile:finished', gulp.series(
	'persists:paths', 'build:jade', 'copy:vendor', 'serve'
));

// Compile files
gulp.task('compile', gulp.series(
	gulp.parallel('clean', 'lint:scripts'),
	'tests',
	gulp.parallel(compileSteps),
	gulp.parallel(scriptCompileSteps),
	'compile:finished'
));

/*
	Gulp primary tasks
 */

gulp.task('default', gulp.series(
	'bower', 'compile',
	cb => {
		// live reload for everything except browserify(as we use watchify)
		gulp.watch(paths.img.input, gulp.series('copy:images'));
		gulp.watch(paths.fonts.input, gulp.series('copy:fonts'));
		gulp.watch(paths.styles.inputAll, gulp.series('build:styles'));
		gulp.watch(paths.markup.input, gulp.series('build:jade'));
		gulp.watch(paths.partials.input, gulp.series('build:partials-jade'));
		gulp.watch(paths.translations.input, gulp.series('build:translations'));

		// start livereload server
		plg.livereload.listen({
			host: config.livereloadListenAddress,
			port: config.livereloadListenPort
		});

		cb(null);
	}
));

gulp.task('develop', gulp.series('bower', 'compile'));

gulp.task('production', gulp.series('bower', 'compile'));

// woa!