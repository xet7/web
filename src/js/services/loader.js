angular.module(primaryApplicationName).service('loader', function() {
	var loader = window.loader;

	this.loadMainApplication = () => {
		loader.loadMainApplication();
	};

	this.resetProgress = () => {
		loader.resetProgress();
	};

	this.setProgress = (text, progress) => {
		loader.setProgress(text, progress);
	};

	this.incProgress = (text, progress) => {
		loader.incProgress(text, progress);
	};

	this.getProgress = () => loader.getProgress();

	this.showLoader = (isImmediate = false) => {
		loader.showLoader(isImmediate);
	};

	this.showLoginApplication = (isImmediate = false) => {
		loader.showLoginApplication(isImmediate);
	};

	this.showMainApplication = (isImmediate = false) => {
		loader.showMainApplication(isImmediate);
	};
});
