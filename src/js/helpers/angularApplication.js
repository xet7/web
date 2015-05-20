const bulkRequire = require('bulk-require');

function AngularApplication ({name, dependencies, productionOnlyDependencies, isPlugin}) {
	const self = this;

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

	this.registerAngularRuns = function (runs) {
		if (runs) {
			for (let runName of Object.keys(runs)) {
				console.debug(`module ${name}: declare a run...`, runName);
				applicationModule.run(runs[runName]);
			}
		}
		return this;
	};

	this.registerAngularConfigs = function (configs) {
		if (configs) {
			for (let configName of Object.keys(configs)) {
				console.debug(`module ${name}: declare a config...`, configName);
				applicationModule.config(configs[configName]);
			}
		}
		return this;
	};

	this.registerAngularConstants = function (constants) {
		if (constants) {
			for (let constsName of Object.keys(constants)) {
				console.debug(`module ${name}: declare a constant...`, constsName);
				applicationModule.constant(constsName, constants[constsName]);
			}
		}
		return this;
	};

	this.registerAngularDecorators = function (decorators) {
		if (decorators) {
			for (let decoratorName of Object.keys(decorators)) {
				console.debug(`module ${name}: declare a decorator...`, decoratorName);
				// @ngInject
				let provider = ($provide) => {
					$provide.decorator(decoratorName, decorators[decoratorName]);
				};
				applicationModule.config(provider);
			}
		}
		return this;
	};

	this.registerAngularFilters = function (filters) {
		if (filters) {
			for (let filterName of Object.keys(filters)) {
				console.debug(`module ${name}: declare a filter...`, filterName);
				applicationModule.filter(filterName, filters[filterName]);
			}
		}
		return this;
	};

	this.registerAngularDirectives = function (directives) {
		if (directives) {
			for (let directiveName of Object.keys(directives)) {
				console.debug(`module ${name}: declare a directive...`, directiveName);
				applicationModule.directive(directiveName, directives[directiveName]);
			}
		}
		return this;
	};

	this.registerAngularFactories = function (factories) {
		if (factories) {
			for (let factoryName of Object.keys(factories)) {
				let declarativeFactoryName = capitalize(factoryName);
				console.debug(`module ${name}: declare a factory...`, declarativeFactoryName);
				applicationModule.factory(declarativeFactoryName, factories[factoryName]);
			}
		}
		return this;
	};

	this.registerAngularServices = function (services) {
		if (services) {
			for (let serviceName of Object.keys(services)) {
				console.debug(`module ${name}: declare a service...`, serviceName);
				applicationModule.service(serviceName, services[serviceName]);
			}
		}
		return this;
	};

	this.registerAngularController = function (controllerName, controller) {
		let declarativeControllerName = capitalize(controllerName);
		console.debug(`module ${name}: declare a controller...`, declarativeControllerName);

		applicationModule.controller(declarativeControllerName, controller);
		return this;
	};

	this.registerAngularControllers = function (controllers) {
		if (controllers) {
			for (let controllerName of Object.keys(controllers))
				self.registerAngularController(controllerName, controllers[controllerName]);
		}
		return this;
	};

	this.registerAngularBlockControllers = function (blocks) {
		if (blocks) {
			for (let blockName of Object.keys(blocks)) {
				console.debug(`module ${name}: declare a block...`, blockName);

				let entries = blocks[blockName];
				for (let entryName of Object.keys(entries)) {
					if (entryName.startsWith('ctrl')) {
						self.registerAngularController(entryName, entries[entryName]);
						continue;
					}

					console.error(`module ${name}: cannot register entry "${entryName}" of block "${blockName}"!`);
				}
			}
		}
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
		return this;
	};

	this.registerStyles = (styles) => {
		console.debug(`module ${name}: registering styles`, styles);
		return this;
	};
}

let application = new AngularApplication(process.env.applicationConfig);

application
	// register angular.js blocks
	.registerAngularRuns(bulkRequire(process.env.applicationPath, 'runs/**/*.js'))
	.registerAngularConfigs(bulkRequire(process.env.applicationPath, 'configs/**/*.js'))
	.registerAngularConstants(bulkRequire(process.env.applicationPath, 'constants/**/*.js'))
	.registerAngularDecorators(bulkRequire(process.env.applicationPath, 'decorators/**/*.js'))
	.registerAngularFilters(bulkRequire(process.env.applicationPath, 'filters/**/*.js'))
	.registerAngularDirectives(bulkRequire(process.env.applicationPath, 'directives/**/*.js'))
	.registerAngularFactories(bulkRequire(process.env.applicationPath, 'factories/**/*.js'))
	.registerAngularServices(bulkRequire(process.env.applicationPath, 'services/**/*.js'))
	.registerAngularControllers(bulkRequire(process.env.applicationPath, 'controllers/**/*.js'))
	.registerAngularBlockControllers(bulkRequire(process.env.applicationPath, 'blocks/**/*.js'))

	// register templates && styles
	.registerTemplates(bulkRequire(process.env.applicationPath, 'blocks/**/*.jade'))
	.registerStyles(bulkRequire(process.env.applicationPath, 'blocks/**/*.less'))
	.registerStyles(bulkRequire(process.env.applicationPath, 'less/**/*.less'));

module.exports = application;