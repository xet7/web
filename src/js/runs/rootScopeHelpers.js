angular.module(primaryApplicationName).run(($rootScope, $translate, translate) => {
	$rootScope.$bind = (bindName, bindHandler) => {
		$rootScope.$on(bindName, bindHandler);
		bindHandler();
	};

	$rootScope.trustedHtml = (html) => {
		return $sce.trustAsHtml(html);
	};

	$rootScope.switchLanguage = (langKey) => {
		translate.switchLanguage(langKey);
	};
});