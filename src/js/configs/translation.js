var fs = require('fs');

angular.module(primaryApplicationName).config(($translateProvider) => {
	var defaultLangKey = 'en';

	var setDefaultTranslation = (translation) => {
		return $translateProvider.translations(defaultLangKey, translation);
	};

	setDefaultTranslation(
		// browserify brfs: load pre-compiled default language so it will be available without extra request to the server
		JSON.parse(fs.readFileSync(__dirname + '/../../../dist/translations/en.json', 'utf8'))
	)
		.fallbackLanguage(defaultLangKey)
		.preferredLanguage(localStorage.lang ? localStorage.lang : defaultLangKey)
		.useStaticFilesLoader({
			prefix: '/translations/',
			suffix: '.json'
		});
});