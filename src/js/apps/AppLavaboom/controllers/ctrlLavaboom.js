angular.module(primaryApplicationName).controller('CtrlLavaboom', function($scope, $state, $translate, crypto, cryptoKeys, user, inbox, loader) {
	var
		beforeDecryptingProgress,
		isInitialized = false;

	const
		lbLoading = $translate.instant('DECRYPTING_INBOX.LB_LOADING'),
		lbDecrypting = $translate.instant('DECRYPTING_INBOX.LB_DECRYPTING'),
		lbSuccess = $translate.instant('DECRYPTING_INBOX.LB_SUCCESS');

	loader.incProgress('Initializing openpgp.js...', 1);

	crypto.initialize();

	loader.incProgress('Authenticating...', 5);

	user.gatherUserInformation();

	var userAuthenticatedListener = $scope.$on('user-authenticated', () => {
		userAuthenticatedListener();

		loader.incProgress('Loading emails...', 5);

		inbox.initialize();
		inbox.requestList('Inbox');
		cryptoKeys.syncKeys();

		beforeDecryptingProgress = loader.getProgress();
	});

	var inboxDecryptStatusListener = $scope.$on('inbox-decrypt-status', (e, status) => {
		if (status.current < status.total)
			loader.setProgress(lbDecrypting, beforeDecryptingProgress + (status.current / status.total) * (100 - beforeDecryptingProgress));
		else {
			isInitialized = true;
			inboxDecryptStatusListener();
			$state.go('main.label', {labelName: 'Inbox'}, {reload: true});
		}
	});

	var stateChangeSuccessListener = $scope.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => {
		if (isInitialized && toState.name == 'main.label') {
			stateChangeSuccessListener();
			loader.showMainApplication();
		}
	});
});