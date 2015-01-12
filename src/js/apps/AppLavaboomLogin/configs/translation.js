angular.module(primaryApplicatioName).config(($translateProvider) => {
	var defaultLangKey = 'en';

	var setDefaultTranslation = (translation) => {
		$translateProvider.translations(defaultLangKey, translation);
	};

	// load pre-compiled default language so it will be available without extra request to the server
	setDefaultTranslation(
		// = require "../../../../../dist/translations/en.json"
	);

	$translateProvider.useStaticFilesLoader({
		prefix: '/translations/',
		suffix: '.json'
	});
	$translateProvider.preferredLanguage(localStorage.lang ? localStorage.lang : defaultLangKey);
});