(() => {
	var Loader = function () {
		console.log('Initialize loader...');

		var loaderContainer, loaderProgressText, loaderProgressBar, loginAppContainer, mainAppContainer;

		var hideContainer = (e) => e.className = 'hidden';

		var showContainer = (e) => e.className = '';

		var setProgress = (text, percent) => {
			loaderProgressText.innerHTML = text;
			loaderProgressBar.setAttribute('aria-valuenow', percent);
			loaderProgressBar.setAttribute('style', `width: ${percent}%;`);
		};

		this.initialize = () => {
			loaderContainer = document.getElementById('loader-container');
			loaderProgressText = document.getElementById('loader-progress-text');
			loaderProgressBar = document.getElementById('loader-progress-bar');
			loginAppContainer = document.getElementById('login-app-container');
			mainAppContainer = document.getElementById('main-app-container');

			setProgress('wow', 50);
			setTimeout(() => hideContainer(loaderContainer), 3000);
		};
	};

	window.Loader = new Loader();
	window.Loader.initialize();
})();