const gulp = global.gulp;
const plg = global.plg;
const bluebird = require('bluebird');
const co = require('co');
const fs = require('fs');
const path = require('path');
const merge = require('merge-stream');
const source = require('vinyl-source-stream');
const url = require('url');

const git = bluebird.promisifyAll(plg.git);

const utils = require('./utils');
const config = require('./config');
const paths = require('./paths');

const pipelines = global.pipelines;
let sharedEnvironment = global.sharedEnvironment;

module.exports = function () {
	const base = path.resolve(__dirname, '..');
	let pluginsBuildTasks = [];
	let pluginsConcatTasks = [];

	let plugins = (process.env.PLUGINS ? process.env.PLUGINS.split(',') : []).map(u => {
		let uri = url.parse(u);

		if (!uri.host)
			uri = url.resolve(config.contribPluginsBaseUrl, u);

		let name = uri.path.split('/').splice(-2).join('-');
		return {
			name: name,
			path: './' + paths.plugins + '/' + name + '/index.toml',
			url: uri.href
		};
	});
	let pluginsByApp = {};

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

	function createBuildTasks() {
		for (let plugin of plugins) {
			console.log(`creating build task for plugin "${plugin.url}"...`);

			let taskName = 'plugins:build:' + plugin.name;
			gulp.task(taskName, () => {
				return pipelines.browserifyBundle(base, plugin.path, 'PLUGIN', sharedEnvironment, 'js', null, (bundler, config) => {
					plugin.config = config;
					if (!pluginsByApp[config.belongsTo])
						pluginsByApp[config.belongsTo] = [];
					pluginsByApp[config.belongsTo].push(plugin);

					return bundler
						.pipe(plg.tap(file => {
							plugin.content = file.contents.toString();
						}));
				});
			});
			pluginsBuildTasks.push(taskName);
		}
	}

	function createConcatTasks() {
		for(let app of Object.keys(pluginsByApp)) {
			console.log(`creating concatenation task for "${app}" application's plugins...`);

			let taskName = 'plugins:concat:' + app;
			gulp.task(taskName, (cb) => {
				return utils.createFiles(pluginsByApp[app])
					.pipe(plg.buffer())
					.pipe(plg.sourcemaps.init())
					.pipe(plg.concat('plugins.js'))
					.pipe(plg.sourcemaps.write())
					.pipe(plg.tap(file => {
						pluginsByApp[app].content = file.contents.toString();
					}));
			});
			pluginsConcatTasks.push(taskName);
		}
	}

	createBuildTasks();
	createConcatTasks();
	gulp.task('build:plugins', gulp.series('plugins:update', gulp.parallel(pluginsBuildTasks), gulp.parallel(pluginsConcatTasks)));
};