angular.module(primaryApplicationName).service('translate', function($rootScope, $http, $translate, co, consts) {
	var self = this;

	this.settings = {};

	this.initialize = () => co(function *(){
		var res = yield $http.get('/translations/index.json');
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
});