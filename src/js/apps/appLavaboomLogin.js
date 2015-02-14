window.coJS = require('co');
let AngularApplication = require('../helpers/angularApplication');

var bulkRequire = require('bulk-require');

let application = new AngularApplication('AppLavaboomLogin');
application.create(
	[
		'templates'
	],
	[
		'lavaboom.api',
		'ui.router',
		'pascalprecht.translate',
		'ngMessages',
		'angular-co',
		'ngAutodisable'
	]
);

application.registerBulks(
	bulkRequire(__dirname + '/../', [
		'runs/*.js',
		'decorators/*.js',
		'filters/*.js',
		'constants/*.js',
		'configs/*.js',
		'directives/*.js',
		'factories/*.js',
		'services/*.js',
		'controllers/*.js'
	]),
	bulkRequire(__dirname + '/AppLavaboomLogin/', [
		'runs/*.js',
		'decorators/*.js',
		'filters/*.js',
		'constants/*.js',
		'configs/*.js',
		'directives/*.js',
		'factories/*.js',
		'services/*.js',
		'controllers/*.js'
	])
);