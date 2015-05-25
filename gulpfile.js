var gulp = require('gulp');
var args = process.argv.slice(2);
var target = process.env.TARGET;

if (target == 'run' || args.length > 0) {
	global.gulp = gulp;
	global.plg = require('gulp-load-plugins')({
		pattern: ['gulp-*', 'gulp.*'],
		replaceString: /\bgulp[\-.]/
	});
	require('toml-require').install();
	require('babel/register');
	require('./gulpfile-es6.js');
}
else
{
	var nodemon = require('gulp-nodemon');
	var console = require('better-console');
	var exec = require('child_process').exec;

	gulp.task('default', function (){
		exec('which gulp', function (error, stdout, stderr) {
			nodemon({
				script: stdout.trim(),
				watch: ['gulpfile.js', 'gulpfile-es6.js', 'serve.js', 'gulp/*'],
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
