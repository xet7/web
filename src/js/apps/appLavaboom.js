window.primaryApplicationName = 'AppLavaboom';
angular.module(primaryApplicationName, ['lavaboom.api', 'ngSanitize', 'ui.router', 'ui.bootstrap', 'ui.select', 'pascalprecht.translate', 'base64']);

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