var fs = require('fs');

angular.module(primaryApplicationName).config(
	($translateProvider, consts) => {
		var setDefaultTranslation = (translation) => {
			return $translateProvider.translations(consts.DEFAULT_LANG, translation);
		};

		setDefaultTranslation(
			// browserify brfs: load pre-compiled default language so it will be available without extra request to the server
			JSON.parse(fs.readFileSync(__dirname + '/../../../dist/translations/en.json', 'utf8'))
		)
			.fallbackLanguage(consts.DEFAULT_LANG)
			.preferredLanguage(localStorage.lang ? localStorage.lang : consts.DEFAULT_LANG)
			.useStaticFilesLoader({
				prefix: '/translations/',
				suffix: '.json'
			});
	});