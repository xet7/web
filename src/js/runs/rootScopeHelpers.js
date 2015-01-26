angular.module(primaryApplicationName).run(($rootScope, $translate, co) => {
	$rootScope.$bind = (bindName, bindHandler) => {
		$rootScope.$on(bindName, bindHandler);
		bindHandler();
	};

	$rootScope.trustedHtml = (html) => {
		return $sce.trustAsHtml(html);
	};

	$rootScope.switchLanguage = (langKey) => {
		localStorage.lang = langKey;
		$translate.use(langKey);
	};
});