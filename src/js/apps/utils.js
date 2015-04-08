window.coJS = require('co');
const bulkRequire = require('bulk-require');

const AngularApplication = require('../helpers/angularApplication');
const application = new AngularApplication({
	applicationName: 'utils',
	dependencies: [
		'lavaboom.api',
		'ui.router',
		'pascalprecht.translate',
		'angular-co'
	]
});

application.registerBulks(
	bulkRequire(__dirname + '/Utils/', '**/*.js')
);