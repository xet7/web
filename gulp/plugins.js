const gulp = global.gulp;
const plg = global.plg;
const bluebird = require('bluebird');
const co = require('co');
const fs = require('fs');
const path = require('path');
const merge = require('merge-stream');
const source = require('vinyl-source-stream');

const git = bluebird.promisifyAll(plg.git);

const config = require('./config');
const paths = require('./paths');

const PLUGIN_REPOS = process.env.PLUGIN_REPOS ? process.env.PLUGIN_REPOS.split(',') : [];
const plugins = [];

const pipelines = global.pipelines;
let sharedEnvironment = global.sharedEnvironment;

gulp.task('plugins:update', (cb) => {
	if (PLUGIN_REPOS.length < 1)
		return cb();

	return co(function *(){
		yield PLUGIN_REPOS.map(repo => co(function *(){
			let name = repo.split('/').splice(-1)[0];
			plugins.push(name);

			console.log('updating', repo);
			try {
				yield git.cloneAsync(repo, {cwd: './' + paths.plugins});
				console.log(`Plugins repository [${repo}] has been cloned...`);
			} catch (err) {
				yield git.pullAsync('origin', 'master', {cwd: './' + paths.plugins + name});
				console.log(`Plugins repository [${repo}] has been updated...`);
			}
		}));

	});
});

let base = path.resolve(__dirname, '..');
let tasks = [];
let contents = [];
for(let pluginName of plugins) {
	console.log('creating task for plugin', pluginName);

	let pluginPath = './' + paths.plugins + '/' + pluginName + '/index.toml';
	let taskName = 'plugins:build:' + pluginName;
	gulp.task(taskName, () => {
		return pipelines.browserifyBundle(base, pluginPath, 'PLUGIN', sharedEnvironment, 'js', null, bundler => {
			return bundler
				.pipe(plg.tap(file => {
					contents[pluginName] = file.contents.toString();
				}));
		});
	});
	tasks.push(taskName);
}

function fileFromVariable(name, content) {
	var stream = source(name);
	stream.write(content);
	process.nextTick(() => stream.end());

	return stream;
}

gulp.task('plugins:concat', (cb) => {
	return merge((Object.keys(contents).map(k => fileFromVariable(k, contents[k]))))
		.pipe(plg.buffer())
		.pipe(plg.sourcemaps.init())
		.pipe(plg.concat('plugins.js'))
		.pipe(plg.sourcemaps.write('.'))
		.pipe(gulp.dest(paths.scripts.output));
});

gulp.task('build:plugins', gulp.series('plugins:update', gulp.parallel(tasks), 'plugins:concat'));