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
		APP_LAVABOOM_LOGIN_SCRIPTS = [
			{
				src: SRC_APP_LAVABOOM_LOGIN_VENDOR,
				progress: 'Loading system libraries...'
			},
			{
				src: SRC_OPENPGP,
				progress: 'Loading openpgp.js...'
			},
			{
				src: SRC_APP_LAVABOOM_LOGIN,
				progress: 'Loading Lavaboom...',
				afterProgress: 'Please wait...'
			}
		],
		APP_LAVABOOM_MAIN_SCRIPTS = [
			{
				src: SRC_APP_LAVABOOM_LOGIN_VENDOR,
				progress: 'Loading system libraries (1/2)...'
			},
			{
				src: SRC_APP_LAVABOOM_MAIN_VENDOR,
				progress: 'Loading system libraries (2/2)...'
			},
			{
				src: SRC_OPENPGP,
				progress: 'Loading openpgp.js...'
			},
			{
				src: SRC_APP_LAVABOOM_MAIN,
				progress: 'Loading Lavaboom...',
				afterProgress: 'Please wait...'
			}
		];

	const
		DEBUG_DELAY = 1500,
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
			progress;

		var showContainer = (e) => {
			setProgress(LB_DONE, 100);

			setTimeout(() => {
				for (var c in containers)
					containers[c].className = 'hidden';
				e.className = '';
			}, APP_TRANSITION_DELAY);
		};

		var setProgress = (text, percent) => {
			loaderProgressText.innerHTML = text;
			loaderProgressBar.setAttribute('aria-valuenow', percent);
			loaderProgressBar.setAttribute('style', `width: ${percent}%;`);
		};

		var loadScripts = (scripts, maxProgress, onFinished) => {
			var load = (loaded = 0) => {
				var script = scripts.splice(0, 1)[0];
				setProgress(script.progress, Math.ceil(progress + (maxProgress - progress) * loaded/scripts.length));

				loadJS(script.src, () => {
					if (scripts.length > 0)
						load(loaded + 1);
					else {
						progress = maxProgress;
						setProgress(script.afterProgress, maxProgress);

						onFinished();
					}
				});
			};

			load();
		};

		var loadApplication = (element, appName, scripts, maxProgress, onFinished) => {
			loadScripts(scripts, maxProgress, () => {
				angular.element(element).ready(() => {
					angular.bootstrap(element, [appName]);
				});

				showContainer(element);

				onFinished();
			});
		};

		this.initialize = () => {
			progress = 10;

			loadScripts([
				{
					src: SRC_CHECKER_VENDOR,
					progress: 'Loading system libraries(1/2)...'
				},
				{
					src: SRC_CHECKER,
					progress: 'Loading system libraries(2/2)...',
					afterProgress: 'Checking...'
				}
			], 30, () => {

			});
		};

		this.loadLoginApplication = () => {
			if (isLoginAppLoaded)
				return;

			loadApplication(loginAppContainer, 'AppLavaboomLogin', APP_LAVABOOM_LOGIN_SCRIPTS, 90, () => {
				isLoginAppLoaded = true;
			});
		};

		this.loadMainApplication = () => {
			if (isMainAppLoaded)
				return;

			loadApplication(mainAppContainer, 'AppLavaboom', APP_LAVABOOM_MAIN_SCRIPTS, 90, () => {
				isMainAppLoaded = true;
			});
		};
	};

	window.loader = new Loader();
	window.loader.initialize();
})();