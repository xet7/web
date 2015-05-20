let fs = require('fs');

module.exports = /*@ngInject*/($translateProvider, consts) => {
	const setDefaultTranslation = (translation) =>
		$translateProvider.translations(consts.DEFAULT_LANG, translation);
	$translateProvider.useSanitizeValueStrategy('escaped');

	setDefaultTranslation(
		// browserify brfs: load pre-compiled default language so it will be available without extra request to the server
		JSON.parse(consts.stripBOM(
			fs.readFileSync(__dirname + '/../../../../dist/translations/en.json', 'utf8')
		))
	)
		.fallbackLanguage(consts.DEFAULT_LANG)
		.preferredLanguage(localStorage.lang ? localStorage.lang : consts.DEFAULT_LANG)
		.useStaticFilesLoader({
			prefix: '/translations/',
			suffix: '.json'
		});
};