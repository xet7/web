module.exports = /*@ngInject*/(loader) => {
	return function(exception) {
		loader.getReporter().reportError(exception);
	};
};