module.exports = (assets) => {
	const Promise = require('./../../../helpers/promise-polyfill');

	const
		SRC_APP_LAVABOOM_MAIN_VENDOR = '/js/lavaMail-vendor.js',
		SRC_OPENPGP = '/vendor/openpgp.js',
		SRC_APP_LAVABOOM_LOGIN = '/js/lavaLogin.js',
		SRC_APP_LAVABOOM_MAIN = '/js/lavaMail.js',
		SRC_UTILS = '/js/lavaUtils.js',
		SRC_UTILS_VENDOR = '/js/lavaUtils-vendor.js',
		SRC_TEMPLATE_CACHE = '/js/templates.js';

	const
		LB_DONE = 'Done!',
		LB_FAIL = 'Cannot load Lavaboom :( \n Please check network connection and try again!';

	const // containers
		loaderContainer = document.getElementById('loader-container'),
		checkerAppContainer = document.getElementById('checker-app-container'),
		loginAppContainer = document.getElementById('login-app-container'),
		mainAppContainer = document.getElementById('main-app-container'),
		containers = [loaderContainer, loginAppContainer, mainAppContainer];

	const
		CHECKER = {
			appName: 'LavaUtils',
			container: checkerAppContainer,
			afterProgressText: 'Checking...',
			afterProgressValue: 30,
			isHidden: true,
			scripts: [
				{
					src: SRC_UTILS_VENDOR,
					progressText: 'Loading Lavaboom utils(1)...'
				},
				{
					src: SRC_UTILS,
					progressText: 'Loading Lavaboom utils(2)...'
				}
			]
		},
		LOADER = {
			container: loaderContainer
		},
		APP_LAVABOOM_LOGIN = {
			appName: 'LavaLogin',
			container: loginAppContainer,
			afterProgressText: 'Please wait...',
			afterProgressValue: 90,
			scripts: [
				{
					src: SRC_OPENPGP,
					progressText: 'Loading openpgp.js...'
				},
				process.env.IS_PRODUCTION ? {
					src: SRC_TEMPLATE_CACHE,
					progressText: 'Loading templates...'
				} : null,
				{
					src: SRC_APP_LAVABOOM_LOGIN,
					progressText: 'Loading Lavaboom...'
				}
			]
		},
		APP_LAVABOOM_MAIN = {
			appName: 'LavaMail',
			container: mainAppContainer,
			afterProgressText: 'Please wait...',
			afterProgressValue: 50,
			scripts: [
				{
					src: SRC_APP_LAVABOOM_MAIN_VENDOR,
					progressText: 'Loading system libraries...'
				},
				{
					src: SRC_OPENPGP,
					progressText: 'Loading openpgp.js...'
				},
				process.env.IS_PRODUCTION ? {
					src: SRC_TEMPLATE_CACHE,
					progressText: 'Loading templates...'
				} : null,
				{
					src: SRC_APP_LAVABOOM_MAIN,
					progressText: 'Loading Lavaboom...'
				}
			]
		};

	const
		DEBUG_DELAY = 0,
		APP_TRANSITION_DELAY = 500;

	const loadedScripts = {};

	const loadJS = (src) => new Promise((resolve, reject) => {
		if (loadedScripts[src])
			return resolve();

		const ref = window.document.getElementsByTagName('script')[ 0 ];
		const script = window.document.createElement('script');
		script.src = src;
		script.async = true;
		script.onload = (e) => {
			console.log(`loader loaded '${src}'`, e);
			loadedScripts[src] = true;

			if (DEBUG_DELAY)
				setTimeout(() => {
					resolve(e);
				}, DEBUG_DELAY);
			else
				resolve(e);
		};
		script.onerror = (e) => {
			console.log(`loader: error during loading '${src}'`, e);
			reject();
		};

		ref.parentNode.insertBefore(script, ref);
	});

	function Loader () {
		console.log('Initialize loader...');

		const self = this;

		const
		// loader elements
			loaderProgressText = document.getElementById('loader-progress-text'),
			loaderProgressBar = document.getElementById('loader-progress-bar');

		let
		// state
			isError = false,
			isLoginAppLoaded = false,
			isMainAppLoaded = false,
			isMainApp = false,
			currentProgress = 0,
			progress = 0;

		const showContainer = (e, lbDone, isImmediate = false) => new Promise((resolve) => {
			if (e.container != LOADER.container)
				self.setProgress(lbDone ? lbDone : LB_DONE, 100);

			setTimeout(() => {
				for (let c of containers)
					c.className = 'hidden';
				e.container.className = '';

				if (e.rootScope && e.rootScope.shownApplication) {
					e.rootScope.$apply(() => {
						e.rootScope.shownApplication();
					});
					resolve();
				} else
					resolve();
			}, isImmediate ? 0 : APP_TRANSITION_DELAY);

		});

		const loadScripts = (opts) => new Promise((resolve, reject) => {
			const total = opts.scripts.length;

			const load = (loaded = 0) => {
				let script = null;
				do {
					script = opts.scripts.splice(0, 1)[0];
				} while (!script);

				self.setProgress(script.progressText, Math.ceil(progress + (opts.afterProgressValue - progress) * loaded / total));

				loadJS(process.env.IS_PRODUCTION && assets[script.src] ? assets[script.src] : script.src)
					.then(() => {
						if (opts.scripts.length > 0)
							load(loaded + 1);
						else {
							progress = opts.afterProgressValue;
							self.setProgress(opts.afterProgressText, opts.afterProgressValue);

							resolve();
						}
					})
					.catch(e => {
						reject(e);
					});
			};

			load();
		});

		const initializeApplication = (app, opts) => {
			console.log('loader: initializing application', app.appName, opts);

			isMainApp = app.container == APP_LAVABOOM_MAIN.container;

			if (!opts)
				opts = {};

			const rootScope = app.rootScope = angular.element(app.container).scope();
			rootScope.$apply(() => {
				console.log('loader: calling rootScope.initializeApplication()');
				rootScope.initializeApplication(opts)
					.then(r => {
						console.log('loader: initialized application', app.appName, 'with result', r);

						if (!app.isHidden)
							showContainer(app, opts.lbDone ? opts.lbDone : (r && r.lbDone ? r.lbDone : null), opts.noDelay ? true : false)
								.then(() => {
									if (rootScope.onApplicationReady)
										rootScope.$apply(() => {
											rootScope.onApplicationReady();
										});
								});
					})
					.catch(err => {
						self.setProgressText(err.message);
						isError = true;
						console.error('loader: initialization of application failed', app.appName, 'with error', err.error);
					});
			});
		};

		const loadApplication = (app, opts) => new Promise((resolve, reject) => {
			console.log('loader: loading application', app.appName, opts);
			isMainApp = app.container == APP_LAVABOOM_MAIN.container;

			loadScripts(app)
				.then(() => {
					angular.element(app.container).ready(() => {
						angular.bootstrap(app.container, [app.appName]);

						initializeApplication(app, opts);

						resolve();
					});
				})
				.catch(e => {
					self.setProgressText(LB_FAIL);
					reject(e);
				});
		});

		this.setProgressText = (text) => {
			if (isError)
				return;
			loaderProgressText.innerHTML = text;
		};

		this.setProgress = (text, percent) => {
			if (isError)
				return;

			percent = Math.ceil(percent);

			console.log('loader.progress', percent, text);
			loaderProgressText.innerHTML = text;
			loaderProgressBar.setAttribute('aria-valuenow', percent);
			loaderProgressBar.setAttribute('style', `width: ${percent}%;`);
			currentProgress = percent;
		};

		this.incProgress = (text, percent) => {
			self.setProgress(text, currentProgress + percent);
		};

		this.getProgress = () => currentProgress;

		this.resetProgress = () => {
			progress = 10;

			self.setProgress('', progress);
		};

		this.initialize = () => {
			progress = 10;
			loadApplication(CHECKER)
				.catch(e => {
					console.error(e);
					self.setProgressText(LB_FAIL);
				});
		};

		this.loadLoginApplication = (opts) => {
			if (!opts)
				opts = {};

			isError = false;
			if (isLoginAppLoaded) {
				initializeApplication(APP_LAVABOOM_LOGIN, opts);
				return;
			}

			loadApplication(APP_LAVABOOM_LOGIN, opts)
				.then(() => {
					isLoginAppLoaded = true;
				});
		};

		this.loadMainApplication = (opts) => {
			if (!opts)
				opts = {};

			isError = false;
			if (isMainAppLoaded) {
				initializeApplication(APP_LAVABOOM_MAIN, opts);
				return;
			}

			loadApplication(APP_LAVABOOM_MAIN, opts)
				.then(() => {
					isMainAppLoaded = true;
				});
		};

		this.isMainApplication = () => isMainApp;

		this.showLoader = (isImmediate = false) => {
			showContainer(LOADER, null, isImmediate);
		};
	}

	window.loader = new Loader();
	window.loader.initialize();
};