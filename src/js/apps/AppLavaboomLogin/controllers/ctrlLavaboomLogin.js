angular.module(primaryApplicationName).controller('CtrlLavaboomLogin', function($q, $rootScope, $state, $scope, $translate, crypto, loader) {
	var isInitialized = false;

	const
		LB_INITIALIZING_OPENPGP = $translate.instant('LOADER.LB_INITIALIZING_OPENPGP'),
		LB_INITIALIZATION_FAILED = $translate.instant('LOADER.LB_INITIALIZATION_FAILED'),
		LB_SUCCESS = $translate.instant('LOADER.LB_SUCCESS');

	$scope.initializeApplication = () => {
		var deferred = $q.defer();

		try {
			loader.incProgress(LB_INITIALIZING_OPENPGP, 5);

			crypto.initialize();

			if (isInitialized) {
				$state.go('login', {}, {reload: true})
					.then(() => deferred.resolve())
					.catch(error => deferred.reject({message: LB_INITIALIZATION_FAILED, error: error}));
			} else {
				isInitialized = true;
				deferred.resolve({lbDone: LB_SUCCESS});
			}
		} catch (error) {
			deferred.reject({message: LB_INITIALIZATION_FAILED, error: error});
		}

		return deferred.promise;
	};
});