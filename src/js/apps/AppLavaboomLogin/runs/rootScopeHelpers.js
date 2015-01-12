angular.module(primaryApplicationName).run(($rootScope, $translate) => {
	$rootScope.switchLanguage = (langKey) => {
		localStorage.lang = langKey;
		$translate.use(langKey);
	};
});