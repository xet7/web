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

const PLUGIN_REPO = process.env.PLUGIN_REPO ? process.env.PLUGIN_REPO : '';
const PLUGIN_REPO_NAME = PLUGIN_REPO ? PLUGIN_REPO.split('/').slice(-1)[0] : '';
const PLUGIN_LIST = process.env.PLUGIN_LIST ? process.env.PLUGIN_LIST.split(',') : [];

const pipelines = global.pipelines;
let sharedEnvironment = global.sharedEnvironment;

gulp.task('plugins:update', (cb) => {
	if (!PLUGIN_REPO)
		return cb();

	console.log('updating', PLUGIN_REPO, '->', PLUGIN_REPO_NAME);
	return co(function *(){
		try {
			yield git.cloneAsync(PLUGIN_REPO, {cwd: './' + paths.plugins});
			console.log('Plugins repository has been cloned...');
		} catch (err) {
			yield git.pullAsync('origin', 'master', {cwd: './' + paths.plugins + PLUGIN_REPO_NAME});
			console.log('Plugins repository has been updated...');
		}
	});
});

let base = path.resolve(__dirname, '..');
let tasks = [];
let contents = [];
for(let pluginName of PLUGIN_LIST) {
	console.log('creating task for plugin', pluginName);

	let pluginPath = './' + paths.plugins + PLUGIN_REPO_NAME + '/' + pluginName + '/index.toml';
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