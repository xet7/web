const bulkRequire = require('bulk-require');
const fs = require('fs');

function AngularApplication ({name, dependencies, productionOnlyDependencies, isPlugin}) {
	const self = this;
	const appName = name;

	if (!productionOnlyDependencies)
		productionOnlyDependencies = [];

	const capitalize = (name) => name.substr(0, 1).toUpperCase() + name.substr(1);
	const moduleDependencies = isPlugin ? undefined : (process.env.IS_PRODUCTION ? productionOnlyDependencies :[]).concat(dependencies);

	console.debug(`module ${appName}: declaring, isPlugin:`, isPlugin, 'depends on:', moduleDependencies);
	const applicationModule = angular.module(appName, moduleDependencies);

	let dynamicTemplates = {};

	let jadeLocals = angular.copy(process.env.jadeLocals);
	jadeLocals.resolveAsset = (name) => jadeLocals.assets[name] ? jadeLocals.assets[name] : name;

	this.getName = () => name;
	this.getDynamicTemplate = (blockName, name) => dynamicTemplates[`${appName}/${blockName}/${name}`];

	this.registerAngularRuns = function (runs) {
		if (runs) {
			for (let runName of Object.keys(runs)) {
				console.debug(`module ${appName}: declare a run...`, runName);
				applicationModule.run(runs[runName]);
			}
		}
		return this;
	};

	this.registerAngularConfigs = function (configs) {
		if (configs) {
			for (let configName of Object.keys(configs)) {
				console.debug(`module ${appName}: declare a config...`, configName);
				applicationModule.config(configs[configName]);
			}
		}
		return this;
	};

	this.registerAngularConstants = function (constants) {
		if (constants) {
			for (let constsName of Object.keys(constants)) {
				console.debug(`module ${appName}: declare a constant...`, constsName);
				applicationModule.constant(constsName, constants[constsName]);
			}
		}
		return this;
	};

	this.registerAngularDecorators = function (decorators) {
		if (decorators) {
			for (let decoratorName of Object.keys(decorators)) {
				console.debug(`module ${appName}: declare a decorator...`, decoratorName);
				let provider = /* @ngInject */($provide) => {
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
				console.debug(`module ${appName}: declare a filter...`, filterName);
				applicationModule.filter(filterName, filters[filterName]);
			}
		}
		return this;
	};

	this.registerAngularDirectives = function (directives) {
		if (directives) {
			for (let directiveName of Object.keys(directives)) {
				console.debug(`module ${appName}: declare a directive...`, directiveName);
				applicationModule.directive(directiveName, directives[directiveName]);
			}
		}
		return this;
	};

	this.registerAngularFactories = function (factories) {
		if (factories) {
			for (let factoryName of Object.keys(factories)) {
				let declarativeFactoryName = capitalize(factoryName);
				console.debug(`module ${appName}: declare a factory...`, declarativeFactoryName);
				applicationModule.factory(declarativeFactoryName, factories[factoryName]);
			}
		}
		return this;
	};

	this.registerAngularServices = function (services) {
		if (services) {
			for (let serviceName of Object.keys(services)) {
				console.debug(`module ${appName}: declare a service...`, serviceName);
				applicationModule.service(serviceName, services[serviceName]);
			}
		}
		return this;
	};

	this.registerAngularController = function (controllerName, controller) {
		let declarativeControllerName = capitalize(controllerName);
		console.debug(`module ${appName}: declare a controller...`, declarativeControllerName);

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
				console.debug(`module ${appName}: declare a block...`, blockName);

				let entries = blocks[blockName];
				for (let entryName of Object.keys(entries)) {
					if (entryName.startsWith('ctrl')) {
						self.registerAngularController(entryName, entries[entryName]);
						continue;
					}

					console.error(`module ${appName}: cannot register entry "${entryName}" of block "${blockName}"!`);
				}
			}
		}
		return this;
	};

	this.registerTemplates = (blocks) => {
		console.debug(`module ${appName}: registering templates`, blocks);

		let templateCache = {};

		if (blocks) {
			for (let blockName of Object.keys(blocks)) {
				let blockTemplates = blocks[blockName];
				for (let templateName of Object.keys(blockTemplates)) {
					let templateFullName = appName + '/' + blockName + '/' + templateName;

					if (templateName.startsWith('__')) {
						console.debug(`module ${appName}: registering dynamic template`, templateFullName);
						dynamicTemplates[templateFullName] = blockTemplates[templateName];
					}
					else if (!templateName.startsWith('_')) {
						console.debug(`module ${appName}: registering static template`, templateFullName, jadeLocals);
						templateCache[templateFullName] = blockTemplates[templateName](jadeLocals);
					}
				}
			}
		}

		applicationModule.run(/* @ngInject */($templateCache) => {
			for(let name of Object.keys(templateCache)) {
				console.debug(`module ${appName}: registering static template in $templateCache`, name);
				$templateCache.put(name, templateCache[name]);
			}
		});
		return this;
	};

	this.registerStyles = (styles) => {
		console.debug(`module ${appName}: registering styles`, styles);
		return this;
	};
}

let config = process.env.applicationConfig;
let application = new AngularApplication(config);

if (process.env.translationPath) {
	let translationConfig = /*@ngInject*/($translateProvider, consts) => {
		const setDefaultTranslation = (translation) =>
			$translateProvider.translations(consts.DEFAULT_LANG, translation);

		let defaultTranslation = consts.stripBOM(fs.readFileSync(process.env.translationPath, 'utf8'));

		console.log('default translate loaded from', process.env.translationPath, defaultTranslation);

		setDefaultTranslation(
			JSON.parse(defaultTranslation)
		)
			.fallbackLanguage(consts.DEFAULT_LANG)
			.preferredLanguage(localStorage.lang ? localStorage.lang : consts.DEFAULT_LANG)
			.useStaticFilesLoader({
				prefix: '/translations/' + config.name + '/',
				suffix: '.json'
			});

		$translateProvider.useSanitizeValueStrategy('escaped');
	};

	application
		.registerAngularConfigs({
			translation: translationConfig
		});
}

application
	// register angular.js blocks
	.registerAngularRuns(bulkRequire(process.env.applicationPath, 'runs/**/*.js').runs)
	.registerAngularConfigs(bulkRequire(process.env.applicationPath, 'configs/**/*.js').configs)
	.registerAngularConstants(bulkRequire(process.env.applicationPath, 'constants/**/*.js').constants)
	.registerAngularDecorators(bulkRequire(process.env.applicationPath, 'decorators/**/*.js').decorators)
	.registerAngularFilters(bulkRequire(process.env.applicationPath, 'filters/**/*.js').filters)
	.registerAngularDirectives(bulkRequire(process.env.applicationPath, 'directives/**/*.js').directives)
	.registerAngularFactories(bulkRequire(process.env.applicationPath, 'factories/**/*.js').factories)
	.registerAngularServices(bulkRequire(process.env.applicationPath, 'services/**/*.js').services)
	.registerAngularControllers(bulkRequire(process.env.applicationPath, 'controllers/**/*.js').controllers)
	.registerAngularBlockControllers(bulkRequire(process.env.applicationPath, 'blocks/**/*.js').blocks)

	// register templates && styles
	.registerTemplates(bulkRequire(process.env.applicationPath, 'blocks/**/*.jade').blocks)
	.registerStyles(bulkRequire(process.env.applicationPath, 'blocks/**/*.less').blocks)
	.registerStyles(bulkRequire(process.env.applicationPath, 'less/**/*.less').less);

module.exports = application;