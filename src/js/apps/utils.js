window.coJS = require('co');
let AngularApplication = require('../helpers/angularApplication');

var bulkRequire = require('bulk-require');

let application = new AngularApplication('utils');
application.create(
	[
	],
	[
		'lavaboom.api',
		'ui.router',
		'pascalprecht.translate',
		'angular-co'
	]
);

application.registerBulks(
	bulkRequire(__dirname + '/Utils/', [
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