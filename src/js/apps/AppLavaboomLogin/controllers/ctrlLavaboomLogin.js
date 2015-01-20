angular.module(primaryApplicationName).controller('CtrlLavaboomLogin', function($q, $rootScope, $state, $scope, $sce, crypto, loader) {
	var isInitialized = false;

	$scope.initializeApplication = () => {
		var deferred = $q.defer();

		try {
			loader.incProgress('Initializing openpgp.js...', 5);

			crypto.initialize();

			if (isInitialized) {
				$state.go('login', {}, {reload: true})
					.then(() => deferred.resolve())
					.catch(error => deferred.reject({message: 'Initialization failed...', error: error}));

			} else {
				isInitialized = true;
				deferred.resolve();
			}
		} catch (error) {
			deferred.reject({message: 'Initialization failed...', error: error});
		}

		return deferred.promise;
	};
});