const gulp = global.gulp;
const plg = global.plg;

const co = require('co');
const chan = require('chan');
const bluebird = require('bluebird');

const crypto = require('crypto');
const fs = bluebird.promisifyAll(require('fs'));
const path = require('path');
const url = require('url');

const childProcess = require('child_process');
const spawn = childProcess.spawn;
const git = bluebird.promisifyAll(plg.git);

const utils = require('./utils');
const config = require('./config');
const paths = require('./paths');

let pipelines = global.pipelines;
let sharedEnvironment = global.sharedEnvironment;
let plumber = global.plumber;

module.exports = function () {
	const base = path.resolve(__dirname, '..');

	let translationsByApp = {};
	let vendorLibs = {};
	let vendorExternalLibs = {};
	let pluginsByApp = {};
	let plugins = (process.env.PLUGINS ? process.env.PLUGINS.split(',') : []).map(u => {
		let uri = url.parse(u);

		if (!uri.host)
			uri = url.parse(url.resolve(config.contribPluginsBaseUrl, u));

		let name = uri.path.split('/').splice(-1)[0];
		return {
			name: name,
			directory: path.resolve('./', paths.plugins, name),
			path: path.resolve('./', paths.plugins, name, 'index.toml'),
			url: uri.href
		};
	});

	let coreApps = config.coreAppNames.map(coreAppName => {
		return {
			name: coreAppName,
			directory: path.resolve('./', paths.scripts.inputAppsFolder, coreAppName),
			path: path.resolve('./', paths.scripts.inputAppsFolder, coreAppName, 'index.toml'),
			url: `core/${coreAppName}`
		};
	});

	gulp.task('plugins:update', (cb) => {
		if (plugins.length < 1)
			return cb();

		return co(function *() {
			yield plugins.map(plugin => co(function *() {
				console.log('updating', plugin.url);
				try {
					yield git.cloneAsync(plugin.url, {cwd: './' + paths.plugins});
					console.log(`Plugins repository [${plugin.url}] has been cloned...`);
				} catch (err) {
					yield git.pullAsync('origin', 'master', {cwd: './' + paths.plugins + plugin.name});
					console.log(`Plugins repository [${plugin.url}] has been updated...`);
				}
			}));
		});
	});

	gulp.task('plugins:finish', (cb) => {
		cb();
	});

	function execute(cmd, args, opts) {
		return co(function *(){
			let p = spawn(cmd, args, opts);
			let ch = chan();

			p.on('exit', function (code) {
				ch(code);
			});

			return yield ch;
		});
	}

	function createInstallTasks(plugins) {
		return plugins.map(plugin => {
			console.log(`creating install task for plugin "${plugin.url}"...`);
			let taskName = 'plugins:install:' + plugin.name;

			gulp.task(taskName, (cb) => {
				let options = {
					cwd: plugin.directory,
					stdio: 'inherit'
				};

				return co(function *() {
					yield [
						execute('bower', ['install'], options),
						execute('npm', ['install'], options)
					];
				});
			});

			return taskName;
		});
	}

	function buildVendorDependency(type, name, directory, coreAppName, vendorLibs) {
		return co(function *(){
			let componentDirectory = '';
			if (type == 'bower')
				componentDirectory = 'bower_components';
			else if (type == 'npm')
				componentDirectory = 'node_modules';
			else if (type == 'vendor')
				componentDirectory = 'vendor';
			else throw new Error(`unsupported vendor dependency! expected to see [npm/bower/vendor]@name`);

			let libraryPath = path.resolve(directory, componentDirectory, name);

			let vendorLib = {
				name: name,
				isMinRequired: false
			};

			const calcHash = (fileName) => co(function *(){
				let content = yield fs.readFileAsync(fileName, 'utf8');
				let sha = crypto.createHash('sha256');
				sha.update(content, 'utf8');
				return sha.digest().toString('hex');
			});

			if (!config.isProduction || libraryPath.endsWith('.min.js')) {
				vendorLib.fileName = libraryPath;
				vendorLib.hash = yield calcHash(libraryPath);
			} else {
				let libraryMinPath = libraryPath.replace('.js', '.min.js');
				try {
					vendorLib.fileName = libraryMinPath;
					vendorLib.hash = yield calcHash(libraryMinPath);
				} catch (err) {
					vendorLib.fileName = libraryPath;
					vendorLib.hash = yield calcHash(libraryPath);
				}
			}

			if (!vendorLibs[coreAppName])
				vendorLibs[coreAppName] = new Map();
			vendorLibs[coreAppName].set(vendorLib.hash, vendorLib);
		});
	}

	function createBuildTasks(plugins, sectionName) {
		return plugins.map(plugin => {
			console.log(`creating build task for plugin "${plugin.url}"...`);
			let taskName = 'plugins:build:' + plugin.name;

			let env = {};
			for(let k of Object.keys(sharedEnvironment))
				env[k] = sharedEnvironment[k];

			gulp.task(taskName, gulp.series('plugins:install:' + plugin.name, () => {
				if (translationsByApp[plugin.name])
					env.translations = translationsByApp[plugin.name];

				return pipelines.browserifyBundle(base, plugin.path, sectionName, env, null, (bundler, config) => {
					let coreAppName = sectionName == 'APPLICATION' ? plugin.name : config.belongsTo;

					plugin.config = config;
					if (config.vendorDependencies) {
						for (let d of config.vendorDependencies) {
							let [type, name] = d.split('@');
							if (!type || !name)
								throw new Error(`vendor dependency supposed to have format [npm/bower/vendor]@name`);

							buildVendorDependency(type, name, plugin.directory, coreAppName, vendorLibs);
						}
					}

					if (config.vendorExternalDependencies) {
						for (let d of config.vendorExternalDependencies) {
							let [type, name] = d.split('@');
							if (!type || !name)
								throw new Error(`vendor dependency supposed to have format [npm/bower/vendor]@name`);

							buildVendorDependency(type, name, plugin.directory, coreAppName, vendorExternalLibs);
						}
					}

					if (sectionName == 'PLUGIN') {
						if (!pluginsByApp[coreAppName])
							pluginsByApp[coreAppName] = [];
						pluginsByApp[coreAppName].push(plugin);
					}

					return bundler
						.pipe(plg.tap(file => {
							plugin.content = file.contents.toString();
						}));
				});
			}));

			return taskName;
		});
	}

	function createVendorBundleTasks() {
		return config.coreAppNames.map(coreAppName => {
			console.log(`creating vendor bundle task for "${coreAppName}"...`);
			let taskName = 'plugins:vendor-embed:' + coreAppName;

			gulp.task(taskName, (cb) => {
				if (!vendorLibs[coreAppName] || vendorLibs[coreAppName].length < 1)
					return cb();

				let list = [...vendorLibs[coreAppName].values()]
					.map(vendorLib => vendorLib.fileName);
				console.log('embed vendor libs for ', coreAppName, list);
				return gulp.src(list)
					.pipe(plg.buffer())
					.pipe(plg.sourcemaps.init({loadMaps: true}))
					.pipe(plg.concat(utils.lowerise(coreAppName) + '-vendor.js'))
					.pipe(plg.sourcemaps.write('.'))
					.pipe(config.isProduction ? plg.tap(pipelines.revTap(paths.scripts.output)) : plg.util.noop())
					.pipe(gulp.dest(paths.scripts.output))
					.pipe(pipelines.livereloadPipeline()());
			});

			return taskName;
		});
	}

	function createTranslationsBuildTasks(base, names) {
		return names.map(name => {
			console.log(`creating translations build task for "${name}"...`);
			let taskName = 'plugins:translations:' + name;

			gulp.task(taskName, (cb) => {
				return gulp.src(base + name + '/translations/*.toml')
					.pipe(plumber())
					.pipe(plg.buffer())
					.pipe(plg.toml({to: JSON.stringify, ext: '.json'}))
					.pipe(plg.tap(file => {
						if (!translationsByApp[name])
							translationsByApp[name] = {};
						translationsByApp[name][path.basename(file.path, path.extname(file.path))] = file.contents.toString();
					}))
					.pipe(gulp.dest(paths.translations.outputForPlugin(name)));
			});

			return taskName;
		});
	}

	function createVendorCopyTasks() {
		return config.coreAppNames.map(coreAppName => {
			console.log(`creating vendor copy task for "${coreAppName}"...`);
			let taskName = 'plugins:vendor-copy:' + coreAppName;

			gulp.task(taskName, (cb) => {
				if (!vendorExternalLibs[coreAppName] || vendorExternalLibs[coreAppName].length < 1)
					return cb();

				let list = [...vendorExternalLibs[coreAppName].values()]
					.map(vendorLib => vendorLib.fileName);
				console.log('copy vendor libs for ', coreAppName, list);
				return gulp.src(list)
					.pipe(plg.tap(f => {
						f.base = '.';
						f.path = path.basename(f.path).replace('.min.js', '.js');
					}))
					.pipe(gulp.dest(paths.scripts.output + '/vendor/' + coreAppName + '/'));
			});

			return taskName;
		});
	}

	function createConcatTasks() {
		return config.coreAppNames.map(coreAppName => {
			console.log(`creating concatenation task for "${coreAppName}" application's plugins...`);
			let taskName = 'plugins:concat:' + coreAppName;

			gulp.task(taskName, (cb) => {
				if (!pluginsByApp[coreAppName] || pluginsByApp[coreAppName].length < 1)
					pluginsByApp[coreAppName] = [];

				let coreAppContent = coreApps.find(a => a.name == coreAppName).content;
				return utils.createFiles([{
					name: coreAppName,
					content: coreAppContent
				}].concat(pluginsByApp[coreAppName]))
					.pipe(plg.buffer())
					.pipe(plg.sourcemaps.init({loadMaps: true}))
					.pipe(plg.concat(utils.lowerise(coreAppName) + '.js'))
					.pipe(plg.sourcemaps.write('.'))
					.pipe(config.isProduction ? plg.tap(pipelines.revTap(paths.scripts.output)) : plg.util.noop())
					.pipe(gulp.dest(paths.scripts.output))
					.pipe(pipelines.livereloadPipeline()());
			});

			return taskName;
		});
	}

	createInstallTasks(plugins);
	createInstallTasks(coreApps);

	let pluginNames = plugins.map(p => p.name);

	let pluginsTranslationTasks = createTranslationsBuildTasks(paths.scripts.inputAppsFolder, config.coreAppNames)
		.concat(createTranslationsBuildTasks(paths.plugins, pluginNames));

	let pluginsBuildTasks = createBuildTasks(plugins, 'PLUGIN');
	let coreBuildTasks = createBuildTasks(coreApps, 'APPLICATION');
	let pluginsVendorBundleTasks = createVendorBundleTasks();

	let pluginsVendorCopyTasks = createVendorCopyTasks();
	let pluginsConcatTasks = createConcatTasks();

	return gulp.series(
		'plugins:update',
		gulp.parallel(pluginsTranslationTasks),
		gulp.parallel(pluginsBuildTasks),
		gulp.parallel(coreBuildTasks),
		gulp.parallel(pluginsVendorBundleTasks),
		gulp.parallel(pluginsVendorCopyTasks),
		gulp.parallel(pluginsConcatTasks),
		'plugins:finish'
	);
};