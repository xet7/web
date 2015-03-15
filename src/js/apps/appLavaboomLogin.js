const bulkRequire = require('bulk-require');

const AngularApplication = require('../helpers/angularApplication');
const application = new AngularApplication({
	applicationName: 'AppLavaboomLogin',
	productionOnlyDependencies: [
		'templates'
	],
	dependencies: [
		'utils',
		'lavaboom.api',
		'ui.router',
		'pascalprecht.translate',
		'ngMessages',
		'angular-co',
		'ngAutodisable'
	]
});

application
	.registerBulks(
		bulkRequire(__dirname + '/AppLavaboomLogin/', '**/*.js')
	);