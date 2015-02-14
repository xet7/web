window.coJS = require('co');
let AngularApplication = require('../helpers/angularApplication');

var bulkRequire = require('bulk-require');

let application = new AngularApplication('AppLavaboom');
application.create(
	[
		'templates'
	],
	[
		'lavaboom.api',
		'ngSanitize',
		'ui.router',
		'ui.bootstrap',
		'ui.select',
		'textAngular',
		'pascalprecht.translate',
		'infinite-scroll',
		'angular-promise-cache',
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
	bulkRequire(__dirname + '/AppLavaboom/', [
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