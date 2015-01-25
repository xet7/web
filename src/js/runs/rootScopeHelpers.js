angular.module(primaryApplicationName).run(($rootScope, $translate, router, co) => {
	$rootScope.$bind = (bindName, bindHandler) => {
		$rootScope.$on(bindName, bindHandler);
		bindHandler();
	};

	$rootScope.trustedHtml = (html) => {
		return $sce.trustAsHtml(html);
	};

	$rootScope.showPopup = router.showPopup;

	$rootScope.hidePopup = router.hidePopup;

	$rootScope.isPopupState = router.isPopupState;

	$rootScope.switchLanguage = (langKey) => {
		localStorage.lang = langKey;
		$translate.use(langKey);
	};
});