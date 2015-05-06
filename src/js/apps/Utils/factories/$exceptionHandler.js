module.exports = /*@ngInject*/(loader) => {
	const reporter = loader.getReporter();

	return function(exception) {
		reporter.reportError(exception);
	};
};