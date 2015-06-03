const fs = require('fs');
const acceptLanguageParser = require('accept-language-parser');

module.exports = function($rootScope, $http, $translate, co, consts) {
	const self = this;

	this.settings = {};

	this.initialize = () => co(function *(){
		let index = process.env.translationIndexPath ? fs.readFileSync(process.env.translationIndexPath, 'utf8') : '';
		if (!index)
			return;

		self.settings = JSON.parse(consts.stripBOM(index));
		console.log('i18n index loaded', self.settings);

		let headersResponse = yield $http.get(`${consts.API_URI}/headers`);
		let headers = headersResponse.data;
		let acceptedLanguage = acceptLanguageParser.parse(headers['Accept-Language'][0]);

		for(let lang of acceptedLanguage) {
			let fullCode = lang.code + (lang.region ? '_' + lang.region : '');
			let translationFile = self.settings.TRANSLATIONS[fullCode];
			if (translationFile) {
				if (!localStorage.lang)
					localStorage.lang = fullCode;
			}
		}

		self.switchLanguage(self.getCurrentLangCode());
	});

	this.getCurrentLangCode = () => localStorage.lang ? localStorage.lang : consts.DEFAULT_LANG;

	this.switchLanguage = (langKey) => {
		localStorage.lang = langKey;
		$translate.use(langKey);
	};
};