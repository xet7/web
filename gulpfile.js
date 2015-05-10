global.gulp = require('gulp');
global.plg = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'gulp.*'],
	replaceString: /\bgulp[\-.]/
});
require('babel/register');
require('./gulpfile-es6.js');