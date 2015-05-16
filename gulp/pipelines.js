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

// Browserify the mighty one
const browserify = require('browserify'),
	babelify = require('babelify'),
	browserifyNgAnnotate = require('browserify-ngannotate'),
	bulkify = require('bulkify'),
	uglifyify = require('uglifyify'),
	stripify = require('stripify'),
	envify = require('envify/custom'),
	watchify = require('watchify'),
	brfs = require('brfs'),
	exorcist = require('exorcist');

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

	this.browserifyBundle = (base, filename, sectionName, sharedEnvironment, codePath = '', pre = null, post = null) => {
		if (!pre)
			pre = bundler => bundler;
		if (!post)
			post = bundler => bundler;

		let isApplicationBundle = filename.endsWith('.toml');
		let inputApplication = isApplicationBundle ? paths.scripts.inputApplication : filename;
		let outputFile = isApplicationBundle ? '' : path.basename(filename);
		let applicationPath = path.resolve(path.dirname(filename), codePath);

		let environment = {};
		for(let k of Object.keys(sharedEnvironment))
			environment[k] = sharedEnvironment[k];

		let bundler = browserify({
			cache: {},
			packageCache: {},
			entries: inputApplication,
			basedir: base,
			debug: config.isDebugable
		});

		function addRequire(content, name) {
			bundler.require(new File({
				contents: new Buffer(content)
			}), {expose: name});
			bundler.exclude(name);
		}

		function ownCodebaseTransform (transform) {
			return filterTransform(
					file => {
						return file.includes('_stream_') ||
							file.includes(path.resolve(base, paths.scripts.inputFolder)) ||
							file.includes(applicationPath);
					},
				transform);
		}

		function bundle(changedFiles) {
			let lintStatus = {};

			let bundleStream = post(
				pre(bundler.bundle(), outputFile)
					.pipe(source(inputApplication))
					.pipe(plg.rename({
						dirname: '',
						basename: outputFile.replace('.js', '')
					}))
					.pipe(plg.buffer()),
				outputFile
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

		if (isApplicationBundle) {
			let application = require('../' + filename)[sectionName];
			let applicationConfig = {
				name: sectionName == 'PLUGIN' ? 'utils' : application.name,
				dependencies: application.dependencies,
				productionOnlyDependencies: application.productionOnlyDependencies,
				isPlugin: sectionName == 'PLUGIN'
			};
			environment.applicationConfig = applicationConfig;
			environment.applicationPath = applicationPath;

			outputFile = application.name;

			addRequire(utils.angularApplicationTemplate, 'AngularApplication');
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

