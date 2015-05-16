var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var console = require('better-console');

var exec = require('child_process').exec;

if (process.env.TARGET == 'run') {
	global.gulp = gulp;
	global.plg = require('gulp-load-plugins')({
		pattern: ['gulp-*', 'gulp.*'],
		replaceString: /\bgulp[\-.]/
	});
	require('toml-require').install();
	require('babel/register');
	require('./gulpfile-es6.js');
}
else {
	gulp.task('default', function (){
		exec('which gulp', function (error, stdout, stderr) {
			nodemon({
				script: stdout.trim(),
				watch: 'gulpfile-es6.js',
				env: {'TARGET': 'run'}
			})
				.on('start', function() {
					console.clear();
				})
				.on('restart', function() {
					console.clear();
				});
		});
	});
}