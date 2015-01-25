angular.module(primaryApplicationName).controller('CtrlLavaboomLogin', function($q, $rootScope, $state, $scope, $translate, co, crypto, loader) {
	var isInitialized = false;

	const
		LB_INITIALIZING_OPENPGP = $translate.instant('LOADER.LB_INITIALIZING_OPENPGP'),
		LB_INITIALIZATION_FAILED = $translate.instant('LOADER.LB_INITIALIZATION_FAILED'),
		LB_SUCCESS = $translate.instant('LOADER.LB_SUCCESS');

	$scope.initializeApplication = () => co(function *(){
		try {
			loader.incProgress(LB_INITIALIZING_OPENPGP, 5);

			crypto.initialize();

			if (isInitialized) {
				yield $state.go('login', {}, {reload: true});
			} else {
				isInitialized = true;
				return {lbDone: LB_SUCCESS};
			}
		} catch (error) {
			throw {message: LB_INITIALIZATION_FAILED, error: error};
		}
	});
});