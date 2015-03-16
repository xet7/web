module.exports = /*@ngInject*/function($rootScope, $http, $translate, co, consts) {
	const self = this;

	this.settings = {};

	this.initialize = () => co(function *(){
		let res = yield $http.get('/translations/index.json');
		self.settings = res.data;
		console.log('i18n index loaded', self.settings);
	});

	this.getCurrentLangCode = () => {
		return localStorage.lang ? localStorage.lang : consts.DEFAULT_LANG;
	};

	this.switchLanguage = (langKey) => {
		localStorage.lang = langKey;
		$translate.use(langKey);
	};
};