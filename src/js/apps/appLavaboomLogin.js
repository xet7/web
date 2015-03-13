const AngularApplication = require('../helpers/angularApplication');
const bulkRequire = require('bulk-require');
const application = new AngularApplication('AppLavaboomLogin');

application.create(
	[
		'templates'
	],
	[
		'utils',
		'lavaboom.api',
		'ui.router',
		'pascalprecht.translate',
		'ngMessages',
		'angular-co',
		'ngAutodisable'
	]
);

application.registerBulks(
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