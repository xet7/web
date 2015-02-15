module.exports = /*@ngInject*/($rootScope, $translate, translate) => {
	$rootScope.$bind = (bindName, bindHandler) => {
		$rootScope.$on(bindName, bindHandler);
		bindHandler();
	};

	$rootScope.switchLanguage = (langKey) => {
		translate.switchLanguage(langKey);
	};

	$rootScope.isInitialized = false;
	$rootScope.isShown = false;
	$rootScope.currentErrorMessage = '';

	$rootScope.$on('$stateChangeSuccess', () => {
		$rootScope.currentErrorMessage = '';
	});

	$rootScope.shownApplication = () => {
		$rootScope.isShown = true;
	};

	$rootScope.whenInitialized = (initializer) => {
		console.log('whenInitialized', $rootScope.isInitialized);
		if ($rootScope.isInitialized)
			initializer();
		else
			$rootScope.$on('initialization-completed', () => initializer());
	};
};