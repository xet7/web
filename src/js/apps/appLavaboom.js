window.primaryApplicationName = 'AppLavaboom';

window.app = angular.module(primaryApplicationName, [
	'lavaboom.api',
	//'utils',
	'ngSanitize',
	'ui.router',
	'ui.bootstrap',
	'ui.select',
	'pascalprecht.translate',
	//'validation.match',
	
	'textAngular'

]);

window.coJS = require('co');

var bulkRequire = require('bulk-require');

bulkRequire(__dirname, [
	'../configs/*.js',
	'../services/*.js',

	'./AppLavaboom/configs/*.js',
	'./AppLavaboom/directives/*.js',
	'./AppLavaboom/services/*.js',
	'./AppLavaboom/controllers/*.js'
]);