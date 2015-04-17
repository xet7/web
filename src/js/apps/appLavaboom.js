const bulkRequire = require('bulk-require');

const AngularApplication = require('../helpers/angularApplication');
const application = new AngularApplication({
	applicationName: 'AppLavaboom',
	dependencies: [
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
		'yaru22.angular-timeago',
		'dialogs.main',
		'ngMessages'
	],
	productionOnlyDependencies: [
		'templates'
	]
});

application.registerBulks(
	bulkRequire(__dirname + '/AppLavaboom/', '**/*.js')
);