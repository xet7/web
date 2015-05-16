const bulkRequire = require('bulk-require');
const AngularApplication = require('AngularApplication');

const application = new AngularApplication(process.env.applicationConfig);
application.registerBulks(
	bulkRequire(process.env.applicationPath, '**/*.js')
);