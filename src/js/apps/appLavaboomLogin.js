(function() {
	angular.module('utils', []);

	window.primaryApplicationName = 'AppLavaboomLogin';
	angular.module(primaryApplicationName, ['lavaboom.api', 'utils', 'ngSanitize','ui.router', 'ui.bootstrap', 'ui.select', 'pascalprecht.translate', 'base64','validation.match']);

	// = require "../configs/*.js"
	// = require "../directives/*.js"
	// = require "../services/*.js"

	// = require "./AppLavaboomLogin/configs/*.js"
	// = require "./AppLavaboomLogin/runs/*.js"
	// = require "./AppLavaboomLogin/directives/*.js"
	// = require "./AppLavaboomLogin/services/*.js"
	// = require "./AppLavaboomLogin/controllers/*.js"

})();
