angular.module('utils', []);

window.primaryApplicationName = 'AppLavaboomLogin';
angular.module(primaryApplicationName, [
	'lavaboom.api',
	'utils',
	'ui.router',
	'pascalprecht.translate',
	'ngMessages',
	'angular-inview',
	'angular-co'
]);

window.coJS = require('co');

var bulkRequire = require('bulk-require');

bulkRequire(__dirname, [
	'../runs/*.js',
	'../decorators/*.js',
	'../configs/*.js',
	'../directives/*.js',
	'../services/*.js',

	'./AppLavaboomLogin/configs/*.js',
	'./AppLavaboomLogin/runs/*.js',
	'./AppLavaboomLogin/directives/*.js',
	'./AppLavaboomLogin/services/*.js',
	'./AppLavaboomLogin/controllers/*.js'
]);