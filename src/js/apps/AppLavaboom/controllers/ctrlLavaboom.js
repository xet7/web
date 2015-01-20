angular.module(primaryApplicationName).controller('CtrlLavaboom', function($q, $scope, $state, $translate, crypto, cryptoKeys, user, inbox, loader) {
	var
		beforeDecryptingProgress;

	const
		lbLoading = $translate.instant('DECRYPTING_INBOX.LB_LOADING'),
		lbDecrypting = $translate.instant('DECRYPTING_INBOX.LB_DECRYPTING'),
		lbSuccess = $translate.instant('DECRYPTING_INBOX.LB_SUCCESS');

	$scope.initializeApplication = () => {
		var deferred = $q.defer();
		try {
			loader.incProgress('Initializing openpgp.js...', 1);

			crypto.initialize();

			loader.incProgress('Authenticating...', 5);

			user.gatherUserInformation()
				.then(() => {
					loader.incProgress('Loading emails...', 5);

					inbox.initialize();
					inbox.requestList('Inbox');
					cryptoKeys.syncKeys();

					beforeDecryptingProgress = loader.getProgress();
				})
				.catch(error => deferred.reject({message: 'Initialization failed...', error: error}));

			var inboxDecryptStatusListener = $scope.$on('inbox-decrypt-status', (e, status) => {
				if (status.current < status.total)
					loader.setProgress(lbDecrypting, beforeDecryptingProgress + (status.current / status.total) * (100 - beforeDecryptingProgress));
				else {
					inboxDecryptStatusListener();

					$state.go('main.label', {labelName: 'Inbox'}, {reload: true})
						.then(() => deferred.resolve())
						.catch(error => deferred.reject({message: 'Initialization failed...', error: error}));
				}
			});
		} catch (error) {
			deferred.reject({message: 'Initialization failed...', error: error});
		}

		return deferred.promise;
	};
});