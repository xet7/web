const fs = require('fs');

module.exports = function($rootScope, $http, $translate, co, consts) {
	const self = this;

	this.settings = {};

	this.initialize = () => co(function *(){
		let index = process.env.translationIndexPath ? fs.readFileSync(process.env.translationIndexPath, 'utf8') : '';
		if (!index)
			return;

		self.settings = JSON.parse(consts.stripBOM(index));
		console.log('i18n index loaded', self.settings);
	});

	this.getCurrentLangCode = () => localStorage.lang ? localStorage.lang : consts.DEFAULT_LANG;

	this.switchLanguage = (langKey) => {
		localStorage.lang = langKey;
		$translate.use(langKey);
	};
};