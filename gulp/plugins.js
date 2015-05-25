const gulp = global.gulp;
const plg = global.plg;

const co = require('co');
const bluebird = require('bluebird');

const fs = bluebird.promisifyAll(require('fs'));
const path = require('path');
const url = require('url');

const git = bluebird.promisifyAll(plg.git);

const utils = require('./utils');
const config = require('./config');
const paths = require('./paths');

let sharedEnvironment = global.sharedEnvironment;
let pipelines = global.pipelines;
let plumber = global.plumber;

module.exports = function () {
	const base = path.resolve(__dirname, '..');

	const dependencyDirectories = {
		'bower':'bower_components',
		'npm':'node_modules',
		'vendor': 'vendor'
	};

	let vendorDependenciesResolutionPromises = [];
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

	gulp.task('dependencies:wait', () => co(function *(){
		yield vendorDependenciesResolutionPromises;
	}));

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
						utils.execute('bower', ['install'], options),
						utils.execute('npm', ['install'], options)
					];
				});
			});

			return taskName;
		});
	}

	function buildVendorDependency(type, name, directory, coreAppName, vendorLibs) {
		if (!vendorLibs.index)
			vendorLibs.index = 0;
		let index = vendorLibs.index++;

		return co(function *(){
			let componentDirectory = dependencyDirectories[type];
			if (!componentDirectory)
				throw new Error(`unsupported vendor dependency! expected to see [npm/bower/vendor]@name`);

			let libraryPath = path.resolve(directory, componentDirectory, name);

			let vendorLib = {
				name: name,
				isMinRequired: false,
				index: index
			};

			if (!config.isProduction || libraryPath.endsWith('.min.js')) {
				vendorLib.fileName = libraryPath;
				vendorLib.hash = yield utils.calcHash(libraryPath);
			} else {
				let libraryMinPath = libraryPath.replace('.js', '.min.js');
				try {
					vendorLib.fileName = libraryMinPath;
					vendorLib.hash = yield utils.calcHash(libraryMinPath);
				} catch (err) {
					vendorLib.fileName = libraryPath;
					vendorLib.hash = yield utils.calcHash(libraryPath);
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

					let fetchVendorDependencies = (dependencies, libs) => {
						if (dependencies) {
							for (let d of dependencies) {
								let [type, name] = d.split('@');
								if (!type || !name)
									throw new Error(`vendor dependency supposed to have format [npm/bower/vendor]@name`);

								vendorDependenciesResolutionPromises.push(buildVendorDependency(type, name, plugin.directory, coreAppName, libs));
							}
						}
					};

					fetchVendorDependencies(config.vendorDependencies, vendorLibs);
					fetchVendorDependencies(config.vendorExternalDependencies, vendorExternalLibs);

					plugin.config = config;
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
					.sort((a, b) => a.index - b.index)
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

	if (pluginsBuildTasks.length < 1)
		pluginsBuildTasks.push(utils.createEmptyTask());

	return gulp.series(
		'plugins:update',
		gulp.parallel(pluginsTranslationTasks),
		gulp.parallel(pluginsBuildTasks),
		gulp.parallel(coreBuildTasks),
		'dependencies:wait',
		gulp.parallel(pluginsVendorBundleTasks),
		gulp.parallel(pluginsVendorCopyTasks),
		gulp.parallel(pluginsConcatTasks)
	);
};