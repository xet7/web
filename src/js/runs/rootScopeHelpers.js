angular.module(primaryApplicationName).run(($rootScope, $translate, router) => {
	$rootScope.trustedHtml = function(html) {
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