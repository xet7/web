angular.module(primaryApplicationName).service('loader', function() {
	var loader = window.loader;

	this.loadMainApplication = () => {
		loader.loadMainApplication();
	};

	this.setProgress = (text, progress) => {
		loader.setProgress(text, progress);
	};

	this.incProgress = (text, progress) => {
		loader.incProgress(text, progress);
	};

	this.getProgress = () => loader.getProgress();

	this.showLoader = () => {
		loader.showLoader();
	};

	this.showLoginApplication = () => {
		loader.showLoginApplication();
	};

	this.showMainApplication = () => {
		loader.showMainApplication();
	};
});
