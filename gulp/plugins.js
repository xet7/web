const gulp = global.gulp;
const plg = global.plg;

const co = require('co');
const fs = require('fs');
const path = require('path');
const url = require('url');

const bluebird = require('bluebird');

const childProcess = bluebird.promisifyAll(require('child_process'));
const exec = childProcess.execAsync;
const git = bluebird.promisifyAll(plg.git);

const utils = require('./utils');
const config = require('./config');
const paths = require('./paths');

const pipelines = global.pipelines;
let sharedEnvironment = global.sharedEnvironment;

module.exports = function (pluginsByApp) {
	const base = path.resolve(__dirname, '..');

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

	function createInstallTasks() {
		return plugins.map(plugin => {
			console.log(`creating install task for plugin "${plugin.url}"...`);
			let taskName = 'plugins:install:' + plugin.name;

			gulp.task(taskName, () => {
				let options = {
					cwd: plugin.directory
				};
				console.log(options);
				return co(function *() {
					try {
						let r = yield exec('bower install', options);
						console.log('bower install', r);
					} catch (err) {}
					try {
						let r = yield exec('npm install', options);
						console.log('npm install', r);
					} catch (err) {}
				});
			});

			return taskName;
		});
	}

	function createBuildTasks() {
		return plugins.map(plugin => {
			console.log(`creating build task for plugin "${plugin.url}"...`);
			let taskName = 'plugins:build:' + plugin.name;

			gulp.task(taskName, gulp.series('plugins:install:' + plugin.name, () => {
				return pipelines.browserifyBundle(base, plugin.path, 'PLUGIN', sharedEnvironment, null, (bundler, config) => {
					plugin.config = config;
					if (!pluginsByApp[config.belongsTo])
						pluginsByApp[config.belongsTo] = [];

					pluginsByApp[config.belongsTo].push(plugin);

					return bundler
						.pipe(plg.tap(file => {
							plugin.content = file.contents.toString();
						}));
				});
			}));

			return taskName;
		});
	}

	function createConcatTasks() {
		return config.coreAppNames.map(coreAppName => {
			console.log(`creating concatenation task for "${coreAppName}" application's plugins...`);
			let taskName = 'plugins:concat:' + coreAppName;

			gulp.task(taskName, (cb) => {
				if (!pluginsByApp[coreAppName] || pluginsByApp[coreAppName].length < 1) {
					pluginsByApp[coreAppName] = [];
					return cb();
				}

				return utils.createFiles(pluginsByApp[coreAppName])
					.pipe(plg.buffer())
					.pipe(plg.sourcemaps.init())
					.pipe(plg.concat('plugins.js'))
					.pipe(plg.sourcemaps.write())
					.pipe(plg.tap(file => {
						pluginsByApp[coreAppName].content = file.contents.toString();
					}));
			});

			return taskName;
		});
	}

	createInstallTasks();
	let pluginsBuildTasks = createBuildTasks();
	let pluginsConcatTasks = createConcatTasks();

	return gulp.series('plugins:update', gulp.parallel(pluginsBuildTasks), gulp.parallel(pluginsConcatTasks));
};