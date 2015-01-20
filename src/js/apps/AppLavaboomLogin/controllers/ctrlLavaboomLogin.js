angular.module(primaryApplicationName).controller('CtrlLavaboomLogin', function($q, $rootScope, $state, $scope, $sce, crypto, loader) {
	$scope.initializeApplication = () => {
		var deferred = $q.defer();

		try {
			loader.incProgress('Initializing openpgp.js...', 5);

			crypto.initialize();

			deferred.resolve();
		} catch (error) {
			deferred.reject({message: 'Initialization failed...', error: error});
		}

		return deferred.promise;
	};
});