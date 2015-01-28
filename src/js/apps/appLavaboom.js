window.primaryApplicationName = 'AppLavaboom';

angular.module(primaryApplicationName, [
	'lavaboom.api',
	'ngSanitize',
	'ui.router',
	'ui.bootstrap',
	'ui.select',
	'textAngular',
	'pascalprecht.translate',
	'validation.match',
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

	'./AppLavaboom/runs/*.js',
	'./AppLavaboom/filters/*.js',
	'./AppLavaboom/configs/*.js',
	'./AppLavaboom/directives/*.js',
	'./AppLavaboom/services/*.js',
	'./AppLavaboom/classes/*.js',
	'./AppLavaboom/controllers/*.js'
]);