module.exports = ($rootScope, router) => {
	$rootScope.showPopup = router.showPopup;
	$rootScope.hidePopup = router.hidePopup;
	$rootScope.isPopupState = router.isPopupState;
};