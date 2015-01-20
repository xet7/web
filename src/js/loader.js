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

	const
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
		APP_LAVABOOM_LOGIN = {
			appName: 'AppLavaboomLogin',
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

		var // containers
			loaderContainer = document.getElementById('loader-container'),
			loginAppContainer = document.getElementById('login-app-container'),
			mainAppContainer = document.getElementById('main-app-container'),
			containers = [loaderContainer, loginAppContainer, mainAppContainer],

			// loader elements
			loaderProgressText = document.getElementById('loader-progress-text'),
			loaderProgressBar = document.getElementById('loader-progress-bar'),

			// state
			isLoginAppLoaded = false,
			isMainAppLoaded = false,
			isMainAppLoading = false,
			currentProgress,
			progress;

		var showContainer = (e, isImmediate = false) => {
			self.setProgress(LB_DONE, 100);

			setTimeout(() => {
				for (var c in containers)
					containers[c].className = 'hidden';
				e.className = '';
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

		var loadApplication = (element, opts, onFinished) => {
			loadScripts(opts, () => {
				angular.element(element).ready(() => {
					angular.bootstrap(element, [opts.appName]);

					onFinished();
				});
			});
		};

		this.setProgress = (text, percent) => {
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

		this.loadLoginApplication = () => {
			if (isLoginAppLoaded)
				return;

			loadApplication(loginAppContainer, APP_LAVABOOM_LOGIN, () => {
				isLoginAppLoaded = true;
			});
		};

		this.loadMainApplication = () => {
			if (isMainAppLoaded)
				return;

			isMainAppLoading = true;

			loadApplication(mainAppContainer, APP_LAVABOOM_MAIN, () => {
				isMainAppLoading = false;
				isMainAppLoaded = true;
			});
		};

		this.isMainApplication = () => isMainAppLoading || isMainAppLoaded;

		this.showLoader = (isImmediate = false) => {
			showContainer(loaderContainer, isImmediate);
		};

		this.showLoginApplication = (isImmediate = false) => {
			showContainer(loginAppContainer, isImmediate);
		};

		this.showMainApplication = (isImmediate = false) => {
			showContainer(mainAppContainer, isImmediate);
		};
	};

	window.loader = new Loader();
	window.loader.initialize();
})();