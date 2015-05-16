function AngularApplication ({name, dependencies, productionOnlyDependencies, isPlugin}) {
	if (!productionOnlyDependencies)
		productionOnlyDependencies = [];

	const capitalize = (name) => name.substr(0, 1).toUpperCase() + name.substr(1);

	const moduleDependencies = isPlugin ? undefined : (process.env.IS_PRODUCTION ? productionOnlyDependencies :[]).concat(dependencies);

	console.log('declaring angular module: ', name, isPlugin, moduleDependencies);
	const applicationModule = angular.module(name, moduleDependencies);

	this.registerBulks = (bulks) => {
		if (bulks.runs) {
			for (let runName of Object.keys(bulks.runs)) {
				console.log(`module ${name}: declare run`, runName);
				applicationModule.run(bulks.runs[runName]);
			}
		}

		if (bulks.configs) {
			for (let configName of Object.keys(bulks.configs)) {
				console.log(`module ${name}: declare config`, configName);
				applicationModule.config(bulks.configs[configName]);
			}
		}

		if (bulks.constants) {
			for (let constsName of Object.keys(bulks.constants)) {
				console.log(`module ${name}: declare constant`, constsName);
				applicationModule.constant(constsName, bulks.constants[constsName]);
			}
		}

		if (bulks.decorators) {
			for (let decoratorName of Object.keys(bulks.decorators)) {
				console.log(`module ${name}: declare decorator`, decoratorName);
				// @ngInject
				let provider = ($provide) => {
					$provide.decorator(decoratorName, bulks.decorators[decoratorName]);
				};
				applicationModule.config(provider);
			}
		}

		if (bulks.filters) {
			for (let filterName of Object.keys(bulks.filters)) {
				console.log(`module ${name}: declare filter`, filterName);
				applicationModule.filter(filterName, bulks.filters[filterName]);
			}
		}

		if (bulks.directives) {
			for (let directiveName of Object.keys(bulks.directives)) {
				console.log(`module ${name}: declare directive`, directiveName);
				applicationModule.directive(directiveName, bulks.directives[directiveName]);
			}
		}

		if (bulks.factories) {
			for (let factoryName of Object.keys(bulks.factories)) {
				let declarativeFactoryName = capitalize(factoryName);
				console.log(`module ${name}: declare factory`, declarativeFactoryName);
				applicationModule.factory(declarativeFactoryName, bulks.factories[factoryName]);
			}
		}

		if (bulks.services) {
			for (let serviceName of Object.keys(bulks.services)) {
				console.log(`module ${name}: declare service`, serviceName);
				applicationModule.service(serviceName, bulks.services[serviceName]);
			}
		}

		if (bulks.controllers) {
			for (let controllerName of Object.keys(bulks.controllers)) {
				let declarativeControllerName = capitalize(controllerName);
				console.log(`module ${name}: declare controller`, declarativeControllerName);
				applicationModule.controller(declarativeControllerName, bulks.controllers[controllerName]);
			}
		}

		console.log('angular module bulks loaded for', name);

		return this;
	};
}

module.exports = AngularApplication;