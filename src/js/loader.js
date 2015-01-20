(() => {
	const
		SRC_APP_LAVABOOM_LOGIN_VENDOR = '/js/appLavaboomLogin-vendor.js',
		SRC_APP_LAVABOOM_MAIN_VENDOR = '/js/appLavaboom-vendor.js',
		SRC_OPENPGP = '/vendor/openpgp.js',
		SRC_APP_LAVABOOM_LOGIN = '/js/appLavaboomLogin.js',
		SRC_APP_LAVABOOM_MAIN = '/js/appLavaboom.js',
		SRC_CHECKER = '/js/checker.js',
		SRC_CHECKER_VENDOR = '/js/checker-vendor.js';

	const
		LB_DONE = 'Done!';

	var // containers
		loaderContainer = document.getElementById('loader-container'),
		loginAppContainer = document.getElementById('login-app-container'),
		mainAppContainer = document.getElementById('main-app-container'),
		containers = [loaderContainer, loginAppContainer, mainAppContainer];

	var
		CHECKER = {
			afterProgressText: 'Checking...',
			afterProgressValue: 30,
			scripts: [
				{
					src: SRC_CHECKER_VENDOR,
					progressText: 'Loading system libraries(1)...'
				},
				{
					src: SRC_CHECKER,
					progressText: 'Loading system libraries(2)...'
				}
			]
		},
		LOADER = {
			container: loaderContainer
		},
		APP_LAVABOOM_LOGIN = {
			appName: 'AppLavaboomLogin',
			container: loginAppContainer,
			afterProgressText: 'Please wait...',
			afterProgressValue: 90,
			scripts: [
				{
					src: SRC_APP_LAVABOOM_LOGIN_VENDOR,
					progressText: 'Loading system libraries(3)...'
				},
				{
					src: SRC_OPENPGP,
					progressText: 'Loading openpgp.js...'
				},
				{
					src: SRC_APP_LAVABOOM_LOGIN,
					progressText: 'Loading Lavaboom...'
				}
			]
		},
		APP_LAVABOOM_MAIN = {
			appName: 'AppLavaboom',
			container: mainAppContainer,
			afterProgressText: 'Please wait...',
			afterProgressValue: 50,
			scripts: [
				{
					src: SRC_APP_LAVABOOM_LOGIN_VENDOR,
					progressText: 'Loading system libraries(3)...'
				},
				{
					src: SRC_APP_LAVABOOM_MAIN_VENDOR,
					progressText: 'Loading system libraries(4)...'
				},
				{
					src: SRC_OPENPGP,
					progressText: 'Loading openpgp.js...'
				},
				{
					src: SRC_APP_LAVABOOM_MAIN,
					progressText: 'Loading Lavaboom...'
				}
			]
		};

	const
		DEBUG_DELAY = 0,
		APP_TRANSITION_DELAY = 1000;

	var loadedScripts = {};

	var loadJS = (src, cb) => {
		if (loadedScripts[src])
			return cb();

		var ref = window.document.getElementsByTagName( 'script' )[ 0 ];
		var script = window.document.createElement( 'script' );
		script.src = src;
		script.async = true;
		ref.parentNode.insertBefore( script, ref );
		script.onload = (e) => {
			loadedScripts[src] = true;

			if (DEBUG_DELAY)
				setTimeout(() => {
					cb(e);
				}, DEBUG_DELAY);
			else
				cb(e);
		};
		return script;
	};

	var Loader = function () {
		console.log('Initialize loader...');

		var self = this;

		var
			// loader elements
			loaderProgressText = document.getElementById('loader-progress-text'),
			loaderProgressBar = document.getElementById('loader-progress-bar'),

			// state
			isError = false,
			isLoginAppLoaded = false,
			isMainAppLoaded = false,
			isMainApp = false,
			currentProgress,
			progress;

		var showContainer = (e, lbDone, isImmediate = false) => {
			if (e.container != LOADER.container)
				self.setProgress(lbDone ? lbDone : LB_DONE, 100);

			setTimeout(() => {
				for (let c of containers)
					c.className = 'hidden';
				e.container.className = '';
			}, isImmediate ? 0 :APP_TRANSITION_DELAY);
		};

		var loadScripts = (opts, onFinished) => {
			var total = opts.scripts.length;
			var load = (loaded = 0) => {
				var script = opts.scripts.splice(0, 1)[0];
				self.setProgress(script.progressText, Math.ceil(progress + (opts.afterProgressValue - progress) * loaded/total));

				loadJS(script.src, () => {
					if (opts.scripts.length > 0)
						load(loaded + 1);
					else {
						progress = opts.afterProgressValue;
						self.setProgress(opts.afterProgressText, opts.afterProgressValue);

						if (onFinished)
							onFinished();
					}
				});
			};

			load();
		};

		var initializeApplication = (app, opts) => {
			console.log('loader: initializing application', app.appName);

			isMainApp = app.container == APP_LAVABOOM_MAIN.container;

			if (!opts)
				opts = {};

			var scope = angular.element(app.container).scope();
			scope.$apply(() => {
				scope.initializeApplication()
					.then(r => {
						showContainer(app, r && r.lbDone ? r.lbDone : opts.lbDone);
					})
					.catch(err => {
						self.setProgressText(err.message);
						isError = true;
						console.error('loader: initialization of app.appName failed', err.error);
					});
			});
		};

		var loadApplication = (app, opts, onFinished) => {
			console.log('loader: loading application', app.appName);

			isMainApp = app.container == APP_LAVABOOM_MAIN.container;

			loadScripts(app, () => {
				angular.element(app.container).ready(() => {
					angular.bootstrap(app.container, [app.appName]);

					initializeApplication(app, opts);

					onFinished();
				});
			});
		};

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
			loadScripts(CHECKER, () => {
				window.checker.check();
			});
		};

		this.loadLoginApplication = (opts) => {
			if (!opts)
				opts = {};

			isError = false;
			if (isLoginAppLoaded)
				return initializeApplication(APP_LAVABOOM_LOGIN, opts);

			loadApplication(APP_LAVABOOM_LOGIN, opts, () => {
				isLoginAppLoaded = true;
			});
		};

		this.loadMainApplication = (opts) => {
			if (!opts)
				opts = {};

			isError = false;
			if (isMainAppLoaded)
				return initializeApplication(APP_LAVABOOM_MAIN, opts);

			loadApplication(APP_LAVABOOM_MAIN, opts, () => {
				isMainAppLoaded = true;
			});
		};

		this.isMainApplication = () => isMainApp;

		this.showLoader = (isImmediate = false) => {
			showContainer(LOADER, null, isImmediate);
		};
	};

	window.loader = new Loader();
	window.loader.initialize();
})();