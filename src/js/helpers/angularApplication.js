function AngularApplication ({applicationName, productionOnlyDependencies, dependencies}) {
	const capitalize = (name) => name.substr(0, 1).toUpperCase() + name.substr(1);

	const applicationModule = angular.module(applicationName, (process.env.IS_PRODUCTION ? productionOnlyDependencies :[]).concat(dependencies));

	this.registerBulks = (bulks) => {
		if (bulks.runs) {
			for (let runName of Object.keys(bulks.runs)) {
				applicationModule.run(bulks.runs[runName]);
			}
		}

		if (bulks.configs) {
			for (let configName of Object.keys(bulks.configs)) {
				applicationModule.config(bulks.configs[configName]);
			}
		}

		if (bulks.constants) {
			for (let constsName of Object.keys(bulks.constants)) {
				applicationModule.constant(constsName, bulks.constants[constsName]);
			}
		}

		if (bulks.decorators) {
			for (let decoratorName of Object.keys(bulks.decorators)) {
				// @ngInject
				let provider = ($provide) => {
					$provide.decorator(decoratorName, bulks.decorators[decoratorName]);
				};
				applicationModule.config(provider);
			}
		}

		if (bulks.filters) {
			for (let filterName of Object.keys(bulks.filters)) {
				applicationModule.filter(filterName, bulks.filters[filterName]);
			}
		}

		if (bulks.directives) {
			for (let directiveName of Object.keys(bulks.directives)) {
				applicationModule.directive(directiveName, bulks.directives[directiveName]);
			}
		}

		if (bulks.factories) {
			for (let factoryName of Object.keys(bulks.factories)) {
				let declarativeFactoryName = capitalize(factoryName);
				applicationModule.factory(declarativeFactoryName, bulks.factories[factoryName]);
			}
		}

		if (bulks.services) {
			for (let serviceName of Object.keys(bulks.services)) {
				applicationModule.service(serviceName, bulks.services[serviceName]);
			}
		}

		if (bulks.controllers) {
			for (let controllerName of Object.keys(bulks.controllers)) {
				let declarativeControllerName = capitalize(controllerName);
				applicationModule.controller(declarativeControllerName, bulks.controllers[controllerName]);
			}
		}

		return this;
	};
}

module.exports = AngularApplication;