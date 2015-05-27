module.exports = function($q) {
	let loader = window.loader;

	this.loadJS = (src, isReload = false) => {
		return $q.when(loader.loadJS(src, isReload));
	};

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

	this.isMainApplication = () => loader.isMainApplication();
};