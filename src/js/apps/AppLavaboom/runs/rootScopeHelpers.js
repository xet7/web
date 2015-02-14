angular.module(primaryApplicationName).run(
	($rootScope, $translate, router, co) => {
		$rootScope.showPopup = router.showPopup;
		$rootScope.hidePopup = router.hidePopup;
		$rootScope.isPopupState = router.isPopupState;
	});