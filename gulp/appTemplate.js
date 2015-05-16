const bulkRequire = require('bulk-require');

const AngularApplication = require('../helpers/angularApplication');
const application = new AngularApplication(APPLICATION_CONFIG);
application.registerBulks(
	bulkRequire(APPLICATION_FOLDER, '**/*.js')
);