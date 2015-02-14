angular.module(primaryApplicationName).controller('CtrlEmailList',
	function($scope, $timeout, $stateParams, inbox, consts) {
		$scope.isLoading = false;

		console.log('loading emails list', $stateParams.threadId);

		$scope.selectedTid = $stateParams.threadId;
		$scope.emails = [];

		if ($scope.selectedTid) {
			var t = $timeout(() => {
				$scope.isLoading = true;
			}, consts.LOADER_SHOW_DELAY);

			$scope.emails = [];
			inbox.getEmailsByThreadId($scope.selectedTid)
				.then(emails => {
					$scope.emails = emails;
				})
				.finally(() => {
					$timeout.cancel(t);
					$scope.isLoading = false;
				});
		}

		var markAsReadTimeout = null;

		if ($scope.selectedTid)
			markAsReadTimeout = $timeout(() => {
				inbox.setThreadReadStatus($scope.selectedTid);
			}, consts.SET_READ_AFTER_TIMEOUT);

		$scope.$on('$destroy', () => {
			if (markAsReadTimeout)
				$timeout.cancel(markAsReadTimeout);
		});
	});
