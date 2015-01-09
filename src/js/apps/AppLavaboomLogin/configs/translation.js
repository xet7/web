angular.module(primaryApplicatioName).config(($translateProvider) => {
	var defaultTranslation = {};
	var setTranslation = (translation) => {
		defaultTranslation = translation;
	};

	setTranslation(
		// = require "../../../../../dist/translations/en.json"
	);


	$translateProvider.translations('en', defaultTranslation);

	$translateProvider.useStaticFilesLoader({
		prefix: '/translations/',
		suffix: '.json'
	});
	$translateProvider.preferredLanguage(localStorage.lang ? localStorage.lang : 'en');
});