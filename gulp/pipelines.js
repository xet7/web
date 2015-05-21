const gulp = global.gulp;
const plg = global.plg;

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const lazypipe = require('lazypipe');
const File = require('vinyl');
const source = require('vinyl-source-stream');
const merge = require('merge-stream');

const utils = require('./utils');
const config = require('./config');
const paths = require('./paths');
const filterTransform = require('filter-transform');
const toml = require('toml');

// Browserify the mighty one
const browserify = require('browserify'),
	babelify = require('babelify'),
	browserifyNgAnnotate = require('browserify-ngannotate'),
	bulkify = require('bulkify'),
	uglifyify = require('uglifyify'),
	stripify = require('stripify'),
	envify = require('envify/custom'),
	watchify = require('watchify'),
	lessify = require('lessify'),
	jadeify = require('jadeify'),
	brfs = require('brfs');

function Pipelines(manifest, plumber, isWatching) {
	const self = this;

	this.revTap = output =>
		file => {
			file.revHash = crypto.createHash('sha1').update(file.contents).digest('hex');

			let key = '/' + output.replace(paths.output, '') + path.basename(file.relative);
			let value = path.dirname(key) + '/' + path.basename(key, path.extname(key)) + '-' + file.revHash + path.extname(key);
			manifest[key] = value;

			file.path = file.path.replace(path.basename(key), path.basename(value));

			console.log('Perform manifest translation for a static asset', key, '->', value);
		};

	this.livereloadIndexPipeline  = () => {
		let isReloaded = false;
		return config.isProduction
			? lazypipe()
			.pipe(plg.util.noop)
			: lazypipe()
			.pipe(plg.tap, () => {
				if (!isReloaded) {
					plg.livereload.reload();
					isReloaded = true;
				}
			});
	};

	this.livereloadPipeline  = () =>
		config.isProduction
			? lazypipe()
			.pipe(plg.util.noop)
			: lazypipe()
			.pipe(plg.ignore.exclude, '*.map')
			.pipe(plg.livereload);

	this.createJadePipeline = (input, output, isTemplateCache) => {
		let pipeline = gulp.src(input)
			.pipe(plumber())
			.pipe(config.isProduction ? plg.ignore.exclude(/.*\.test.*/) : plg.util.noop())
			.pipe(plg.ignore.exclude(/\/_.*/))
			.pipe(plg.jade({
				locals: {
					fs: fs,
					resolveAsset: (name) => manifest[name] ? manifest[name] : name,
					assets: manifest,
					globs: {
						IS_PRODUCTION: process.env.IS_PRODUCTION,
						API_URI: process.env.API_URI,
						ROOT_DOMAIN: process.env.ROOT_DOMAIN
					}
				}
			}))
			.pipe(gulp.dest(output))
			.pipe(self.livereloadIndexPipeline()());

		if (config.isProduction && isTemplateCache) {
			pipeline = pipeline
				.pipe(plg.sourcemaps.init())
				.pipe(plg.angularTemplatecache({
					root: output.split('/').filter(p => !!p).slice(-1)[0], standalone: true
				}))
				.pipe(plg.uglify())
				.pipe(plg.tap(self.revTap(paths.scripts.output)))
				.pipe(plg.sourcemaps.write('.'))
				.pipe(gulp.dest(paths.scripts.output));
		}

		return pipeline;
	};

	this.lintScripts = (src, status = null) => {
		if (status)
			status.isError = false;

		return gulp.src(src)
			.pipe(plumber())
			.pipe(plg.cached('lint:scripts'))
			.pipe(plg.tap((file, t) =>
					console.log('Linting: "' + file.relative + '" ...')
			))
			.pipe(plg.jshint())
			.pipe(plg.jshint.reporter(plg.jshintStylish))
			.pipe(plg.jshint.reporter({
				reporter: (result, config, options) => {
					if (status)
						status.isError = true;

					delete plg.cached.caches['lint:scripts'];
				}
			}))
			.pipe(plg.jshint.reporter('fail'));
	};

	this.browserifyBundle = (base, filename, sectionName, sharedEnvironment, preBundleAction = null, postBundleAction = null) => {
		if (!preBundleAction)
			preBundleAction = bundler => bundler;
		if (!postBundleAction)
			postBundleAction = bundler => bundler;

		let applicationConfig = require(path.resolve(base, filename));
		let application = applicationConfig[sectionName];

		if (!application)
			throw new Error(`section "${sectionName}" required!`);

		if (sectionName == 'PLUGIN') {
			if (!application.belongsTo)
				throw new Error(
					`unexpected empty value ${sectionName}.belongsTo! ` +
					`define ${sectionName}.belongsTo`
				);

			if (!config.coreAppNames.includes(application.belongsTo))
				throw new Error(
					`unknown core application name "${application.belongsTo}" found! ` +
					`make sure ${sectionName}.belongsTo resolves to one of core application names`
				);
		}

		if (sectionName == 'APPLICATION'){
			if (application.belongsTo)
				throw new Error(
					`unexpected value ${sectionName}.belongsTo! supported only for plugins`+
					`define ${sectionName}.belongsTo`
				);
		}

		if (application.type == 'angular') {
			if (!application.moduleName)
				throw new Error(
					`unexpected empty value "${sectionName}.moduleName" found! ` +
					`make sure ${sectionName}.moduleName is defined`
				);
		}

		let browserifyEntryFile = application.type == 'angular' ? path.resolve(base, paths.scripts.inputApplication) : path.resolve(base, path.dirname(filename), application.entry);
		let outputName = utils.lowerise(application.name);
		let applicationPath = path.dirname(filename);

		let environment = {};
		for(let k of Object.keys(sharedEnvironment))
			environment[k] = sharedEnvironment[k];
		environment.base = base;
		environment.jadeLocals = {
			fs: fs,
			assets: manifest,
			globs: {
				IS_PRODUCTION: process.env.IS_PRODUCTION,
				API_URI: process.env.API_URI,
				ROOT_DOMAIN: process.env.ROOT_DOMAIN
			}
		};

		let bundler = browserify({
			cache: {},
			packageCache: {},
			entries: browserifyEntryFile,
			basedir: base,
			debug: config.isDebugable
		});

		function addRequire(path, name) {
			bundler.require(path, {expose: name});
			bundler.exclude(name);
		}

		function ownCodebaseTransform (transform) {
			return filterTransform(
					file => {
						let r  = file.includes('_stream_') ||
							paths.scripts.inputFolders.map(e => path.resolve(base, e)).some(e => file.includes(e)) ||
							file.includes(applicationPath);
						return r;
					},
				transform);
		}

		function bundle(changedFiles) {
			let lintStatus = {};

			let bundleStream = postBundleAction(
				preBundleAction(bundler.bundle(), application)
					.pipe(source(browserifyEntryFile))
					.pipe(plg.rename({
						dirname: '',
						basename: outputName
					}))
					.pipe(plg.buffer()),
				application
			);

			if (changedFiles) {
				let lintStream = self.lintScripts(changedFiles, lintStatus);

				return merge(lintStream, bundleStream);
			}

			bundleStream.on('error', (err) => {
				console.log('browserify error:', err);
			});

			return bundleStream;
		}

		if (isWatching)
			bundler = watchify(bundler, {poll: true});

		bundler
			.transform(ownCodebaseTransform(babelify), {externalHelpers: true})
			.transform(ownCodebaseTransform(lessify))
			.transform(ownCodebaseTransform(jadeify))
			.transform(ownCodebaseTransform(envify(environment)))
			.transform(ownCodebaseTransform(bulkify))
			.transform(ownCodebaseTransform(brfs));

		if (!config.isLogs)
			bundler
				.transform(stripify);

		if (config.isProduction)
			bundler
				.transform(ownCodebaseTransform(browserifyNgAnnotate))
				.transform(uglifyify);


		if (application.type == 'angular') {
			environment.applicationConfig = {
				name: application.moduleName,
				dependencies: application.dependencies,
				productionOnlyDependencies: application.productionOnlyDependencies,
				isPlugin: sectionName == 'PLUGIN'
			};
			environment.applicationPath = applicationPath;
			addRequire('./src/js/helpers/angularApplication.js', 'AngularApplication');
		}

		if (isWatching)
			bundler
				.on('update', (changedFiles) => {
					console.log(`re-bundling '${filename}'...`);
					return bundle(changedFiles);
				})
				.on('log', msg => {
					console.log(`bundled '${filename}'`, msg);
				});

		return bundle();
	};
}

module.exports = Pipelines;