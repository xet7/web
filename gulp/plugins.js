const gulp = global.gulp;
const plg = global.plg;
const bluebird = require('bluebird');
const co = require('co');
const fs = require('fs');

const git = bluebird.promisifyAll(plg.git);

const config = require('./config');
const paths = require('./paths');

const PLUGIN_REPO = process.env.PLUGIN_REPO ? process.env.PLUGIN_REPO : '';
const PLUGIN_LIST = process.env.PLUGIN_LIST ? process.env.PLUGIN_LIST.split(',') : [];

gulp.task('update-plugins', (cb) => {
	if (!PLUGIN_REPO)
		return cb();

	let name = PLUGIN_REPO.split('/').slice(-1)[0];

	console.log('updating', PLUGIN_REPO, '->', name);
	return co(function *(){
		try {
			yield git.cloneAsync(PLUGIN_REPO, {cwd: './' + paths.plugins});
			console.log('Plugins repository has been cloned...');
		} catch (err) {
			yield git.pullAsync('origin', 'master', {cwd: './' + paths.plugins + name});
			console.log('Plugins repository has been updated...');
		}
	});
});