angular.module('utils', []);

window.primaryApplicationName = 'AppLavaboomLogin';
angular.module(primaryApplicationName, ['lavaboom.api', 'utils', 'ngSanitize','ui.router', 'ui.bootstrap', 'ui.select', 'pascalprecht.translate', 'base64','validation.match']);

window.coJS = require('co');

var bulkRequire = require('bulk-require');

bulkRequire(__dirname, [
	'../configs/*.js',
	'../services/*.js',
	"../directives/*.js",

	'./AppLavaboomLogin/configs/*.js',
	'./AppLavaboomLogin/runs/*.js',
	'./AppLavaboomLogin/directives/*.js',
	'./AppLavaboomLogin/services/*.js',
	'./AppLavaboomLogin/controllers/*.js'
]);