angular.module(primaryApplicationName).service('loader', function() {
	var loader = window.loader;

	this.loadMainApplication = (opts) => {
		loader.loadMainApplication(opts);
	};

	this.loadLoginApplication = (opts) => {
		loader.loadLoginApplication(opts);
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

	this.isMainApplication = () => {
		return loader.isMainApplication();
	};
});