var fs = require('fs');

angular.module(primaryApplicationName).config(($translateProvider) => {
	var defaultLangKey = 'en';

	var setDefaultTranslation = (translation) => {
		$translateProvider.translations(defaultLangKey, translation);
	};

	setDefaultTranslation(
		// browserify brfs: load pre-compiled default language so it will be available without extra request to the server
		fs.readFileSync(__dirname + '/../../../dist/translations/en.json')
	);

	$translateProvider.useStaticFilesLoader({
		prefix: '/translations/',
		suffix: '.json'
	});
	$translateProvider.preferredLanguage(localStorage.lang ? localStorage.lang : defaultLangKey);
});