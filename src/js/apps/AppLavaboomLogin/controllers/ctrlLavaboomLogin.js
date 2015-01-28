angular.module(primaryApplicationName).controller('CtrlLavaboomLogin', function($q, $rootScope, $state, $scope, $translate, co, crypto, loader) {
	var translations = {};
	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_INITIALIZING_OPENPGP = $translate.instant('LOADER.LB_INITIALIZING_OPENPGP');
		translations.LB_INITIALIZATION_FAILED = $translate.instant('LOADER.LB_INITIALIZATION_FAILED');
		translations.LB_SUCCESS = $translate.instant('LOADER.LB_SUCCESS');
	});

	$scope.isInitialized = false;

	$scope.initializeApplication = () => co(function *(){
		try {
			loader.incProgress(translations.LB_INITIALIZING_OPENPGP, 5);

			crypto.initialize();

			if ($scope.isInitialized) {
				yield $state.go('login', {}, {reload: true});
			} else {
				$scope.isInitialized = true;
				return {lbDone: translations.LB_SUCCESS};
			}
		} catch (error) {
			throw {message: translations.LB_INITIALIZATION_FAILED, error: error};
		}
	});
});