(() => {
	var Loader = function () {
		console.log('Initialize loader...');

		var loaderContainer, loginAppContainer, mainAppContainer, containers, loaderProgressText, loaderProgressBar;

		var showContainer = (e) => {
			for(var c in containers)
				containers[c].className = 'hidden';
			e.className = '';
		};

		var setProgress = (text, percent) => {
			loaderProgressText.innerHTML = text;
			loaderProgressBar.setAttribute('aria-valuenow', percent);
			loaderProgressBar.setAttribute('style', `width: ${percent}%;`);
		};

		var loadJS = (src, cb) => {
			var ref = window.document.getElementsByTagName( 'script' )[ 0 ];
			var script = window.document.createElement( 'script' );
			script.src = src;
			script.async = true;
			ref.parentNode.insertBefore( script, ref );
			if (cb && typeof(cb) === 'function')
				script.onload = cb;
			return script;
		};

		var loadApplication = (element, appName, scripts, initialProgress, maxProgress) => {
			var load = (loaded = 0) => {
				var script = scripts.splice(0, 1)[0];
				setProgress(script.progress, Math.ceil(initialProgress + (maxProgress - initialProgress) * loaded/scripts.length));

				loadJS(script.src, () => {
					if (scripts.length > 0)
						load(loaded + 1);
					else {
						setProgress(script.afterProgress, maxProgress);

						angular.element(element).ready(() => {
							angular.bootstrap(element, [appName]);
						});

						showContainer(element);
					}
				});
			};

			load();
		};

		this.initialize = () => {
			loaderContainer = document.getElementById('loader-container');
			loaderProgressText = document.getElementById('loader-progress-text');
			loaderProgressBar = document.getElementById('loader-progress-bar');
			loginAppContainer = document.getElementById('login-app-container');
			mainAppContainer = document.getElementById('main-app-container');
			containers = [loaderContainer, loginAppContainer, mainAppContainer];

			loadApplication(loginAppContainer, 'AppLavaboomLogin', [
				{
					src: '/js/appLavaboomLogin-vendor.js',
					progress: 'Loading system libraries...'
				},
				{
					src: '/vendor/openpgp.js',
					progress: 'Loading openpgp.js...'
				},
				{
					src: '/js/appLavaboomLogin.js',
					progress: 'Loading Lavaboom...',
					afterProgress: 'Checking...'
				}
			], 10, 90);
		};
	};

	window.Loader = new Loader();
	window.Loader.initialize();
})();

