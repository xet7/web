const gulp = global.gulp;
const plg = global.plg;

let crypto = require('crypto');
let fs = require('fs');
let path = require('path');
let lazypipe = require('lazypipe');

let config = require('./config');
let paths = require('./paths');

function Pipelines(manifest, plumber) {
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
}

module.exports = Pipelines;

