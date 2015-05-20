const bulkRequire = require('bulk-require');

function AngularApplication ({name, dependencies, productionOnlyDependencies, isPlugin}) {
	if (!productionOnlyDependencies)
		productionOnlyDependencies = [];

	const capitalize = (name) => name.substr(0, 1).toUpperCase() + name.substr(1);
	const moduleDependencies = isPlugin ? undefined : (process.env.IS_PRODUCTION ? productionOnlyDependencies :[]).concat(dependencies);

	console.debug(`module ${name}: declaring, isPlugin:`, isPlugin, 'depends on:', moduleDependencies);
	const applicationModule = angular.module(name, moduleDependencies);

	let templates = {};

	this.getDynamicTemplate = (blockName, name) => {
		return templates[`${blockName}/${name}`];
	};

	this.registerAngular = function (bulks) {
		if (bulks.runs) {
			for (let runName of Object.keys(bulks.runs)) {
				console.debug(`module ${name}: declare a run...`, runName);
				applicationModule.run(bulks.runs[runName]);
			}
		}

		if (bulks.configs) {
			for (let configName of Object.keys(bulks.configs)) {
				console.debug(`module ${name}: declare a config...`, configName);
				applicationModule.config(bulks.configs[configName]);
			}
		}

		if (bulks.constants) {
			for (let constsName of Object.keys(bulks.constants)) {
				console.debug(`module ${name}: declare a constant...`, constsName);
				applicationModule.constant(constsName, bulks.constants[constsName]);
			}
		}

		if (bulks.decorators) {
			for (let decoratorName of Object.keys(bulks.decorators)) {
				console.debug(`module ${name}: declare a decorator...`, decoratorName);
				// @ngInject
				let provider = ($provide) => {
					$provide.decorator(decoratorName, bulks.decorators[decoratorName]);
				};
				applicationModule.config(provider);
			}
		}

		if (bulks.filters) {
			for (let filterName of Object.keys(bulks.filters)) {
				console.debug(`module ${name}: declare a filter...`, filterName);
				applicationModule.filter(filterName, bulks.filters[filterName]);
			}
		}

		if (bulks.directives) {
			for (let directiveName of Object.keys(bulks.directives)) {
				console.debug(`module ${name}: declare a directive...`, directiveName);
				applicationModule.directive(directiveName, bulks.directives[directiveName]);
			}
		}

		if (bulks.factories) {
			for (let factoryName of Object.keys(bulks.factories)) {
				let declarativeFactoryName = capitalize(factoryName);
				console.debug(`module ${name}: declare a factory...`, declarativeFactoryName);
				applicationModule.factory(declarativeFactoryName, bulks.factories[factoryName]);
			}
		}

		if (bulks.services) {
			for (let serviceName of Object.keys(bulks.services)) {
				console.debug(`module ${name}: declare a service...`, serviceName);
				applicationModule.service(serviceName, bulks.services[serviceName]);
			}
		}

		function declareController (controllerName, controller) {
			let declarativeControllerName = capitalize(controllerName);
			console.debug(`module ${name}: declare a controller...`, declarativeControllerName);

			applicationModule.controller(declarativeControllerName, controller);
		}

		if (bulks.controllers) {
			for (let controllerName of Object.keys(bulks.controllers))
				declareController(controllerName, bulks.controllers[controllerName]);
		}

		if (bulks.blocks) {
			for (let blockName of Object.keys(bulks.blocks)) {
				console.debug(`module ${name}: declare a block...`, blockName);

				let entries = bulks.blocks[blockName];
				for (let entryName of Object.keys(entries)) {
					if (entryName.startsWith('ctrl')) {
						declareController(entryName, entries[entryName]);
						continue;
					}

					console.error(`module ${name}: cannot register entry "${entryName}" of block "${blockName}"!`);
				}
			}
		}

		console.debug(`module ${name}: angular.js declarations loaded`);

		return this;
	};

	this.registerTemplates = (templates) => {
		console.debug(`module ${name}: registering templates`, templates);

		let templateCache = {};

		if (templates.blocks) {
			for (let blockName of Object.keys(templates.blocks)) {
				let blockTemplates = templates.blocks[blockName];
				for (let templateName of Object.keys(blockTemplates)) {
					let templateFullName = blockName + '/' + templateName;

					if (templateName.startsWith('_')) {
						console.debug(`module ${name}: registering dynamic template`, templateFullName);
						templates[templateFullName] = blockTemplates[templateName];
					}
					else {
						console.debug(`module ${name}: registering static template`, templateFullName);
						templateCache[templateFullName] = blockTemplates[templateName]();
					}
				}
			}
		}

		applicationModule.run(/* @ngInject */($templateCache) => {
			for(let name of Object.keys(templateCache)) {
				console.debug(`module ${name}: registering static template in $templateCache`, name);
				$templateCache.put(name, templateCache[name]);
			}
		});
	};

	this.registerStyles = (styles) => {
		console.debug(`module ${name}: registering styles`, styles);
	};
}

let application = new AngularApplication(process.env.applicationConfig);

application.registerAngular(
	bulkRequire(process.env.applicationPath, '**/*.js')
);

application.registerTemplates(
	bulkRequire(process.env.applicationPath,  '**/*.jade')
);

application.registerStyles(
	bulkRequire(process.env.applicationPath, '**/*.less')
);

module.exports = application;