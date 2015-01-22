angular.module(primaryApplicationName).controller('CtrlLavaboom', function($q, $scope, $state, $translate, crypto, cryptoKeys, user, inbox, loader) {
	var
		beforeDecryptingProgress;

	const
		LB_INITIALIZING_OPENPGP = $translate.instant('LOADER.LB_INITIALIZING_OPENPGP'),
		LB_AUTHENTICATING = $translate.instant('LOADER.LB_AUTHENTICATING'),
		LB_DECRYPTING = $translate.instant('LOADER.LB_DECRYPTING'),
		LB_LOADING_EMAILS = $translate.instant('LOADER.LB_LOADING_EMAILS'),
		LB_INITIALIZATION_FAILED = $translate.instant('LOADER.LB_INITIALIZATION_FAILED'),
		LB_SUCCESS = $translate.instant('LOADER.LB_SUCCESS');

	$scope.isInitialized = false;

	$scope.initializeApplication = () => {
		var deferred = $q.defer();
		try {
			loader.incProgress(LB_INITIALIZING_OPENPGP, 1);

			crypto.initialize();

			loader.incProgress(LB_AUTHENTICATING, 5);

			user.gatherUserInformation()
				.then(() => {
					loader.incProgress(LB_LOADING_EMAILS, 5);

					inbox.initialize();
					inbox.requestList('Inbox');
					cryptoKeys.syncKeys();

					beforeDecryptingProgress = loader.getProgress();
				})
				.catch(error => deferred.reject({message: LB_INITIALIZATION_FAILED, error: error}));

			var inboxDecryptStatusListener = $scope.$on('inbox-decrypt-status', (e, status) => {
				if (status.current < status.total)
					loader.setProgress(LB_DECRYPTING, beforeDecryptingProgress + (status.current / status.total) * (100 - beforeDecryptingProgress));
				else {
					inboxDecryptStatusListener();

					$state.go('main.label', {labelName: 'Inbox'}, {reload: true})
						.then(() => {
							$scope.isInitialized = true;
							deferred.resolve({lbDone: LB_SUCCESS});
						})
						.catch(error => deferred.reject({message: LB_INITIALIZATION_FAILED, error: error}));
				}
			});
		} catch (error) {
			deferred.reject({message: LB_INITIALIZATION_FAILED, error: error});
		}

		return deferred.promise;
	};
});