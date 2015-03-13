const AngularApplication = require('../helpers/angularApplication');
const bulkRequire = require('bulk-require');
const application = new AngularApplication('AppLavaboom');

application.create(
	[
		'templates'
	],
	[
		'utils',
		'lavaboom.api',
		'ngSanitize',
		'ui.router',
		'ui.bootstrap',
		'ui.select',
		'textAngular',
		'pascalprecht.translate',
		'infinite-scroll',
		'angular-co',
		'ngAutodisable',
		'cfp.hotkeys',
		'angularMoment'
	]
);

application.registerBulks(
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