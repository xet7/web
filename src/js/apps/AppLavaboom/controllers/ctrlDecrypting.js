angular.module(primaryApplicationName).controller('CtrlDecrypting', function($scope, $state, $translate, $timeout, consts, inbox, cryptoKeys) {
	$scope.progress = 0;

	var lbLoading = $translate.instant('DECRYPTING_INBOX.LB_LOADING');
	var lbDecrypting = $translate.instant('DECRYPTING_INBOX.LB_DECRYPTING');
	var lbSuccess = $translate.instant('DECRYPTING_INBOX.LB_SUCCESS');

	$scope.caption = lbLoading;

	$scope.$on('user-authenticated', () => {
		inbox.requestList();
		cryptoKeys.syncKeys();
	});

	$scope.$on('inbox-decrypt-status', (e, status) => {
		if (status.current < status.total) {
			$scope.caption = lbDecrypting;
			$scope.progress = 25 + (status.current / status.total) * 75;
		} else {
			$scope.caption = lbSuccess;
			$scope.progress = 100;

			$timeout(() => {
				$state.go('main.inbox');
			}, consts.INBOX_REDIRECT_DELAY);
		}
	});
});