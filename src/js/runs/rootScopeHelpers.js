angular.module(primaryApplicationName).run(
	($rootScope, $translate, translate) => {
		$rootScope.$bind = (bindName, bindHandler) => {
			$rootScope.$on(bindName, bindHandler);
			bindHandler();
		};

		$rootScope.switchLanguage = (langKey) => {
			translate.switchLanguage(langKey);
		};

		$rootScope.isInitialized = false;

		$rootScope.whenInitialized = (initializer) => {
			console.log('whenInitialized', $rootScope.isInitialized);
			if ($rootScope.isInitialized)
				initializer();
			else
				$rootScope.$on('initialization-completed', () => initializer());
		};
	});