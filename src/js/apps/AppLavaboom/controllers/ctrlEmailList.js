module.exports = /*@ngInject*/($rootScope, $scope, $timeout, $stateParams, inbox, consts) => {
	console.log('loading emails list', $stateParams.threadId);

	$scope.isLoading = false;

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

	let markAsReadTimeout = null;
	let emails = null;

	$rootScope.$on('emails-list-hide', () => {
		emails = $scope.emails;
		$scope.emails = [];
	});

	$rootScope.$on('emails-list-restore', () => {
		$scope.emails = emails;
	});

	if ($scope.selectedTid)
		markAsReadTimeout = $timeout(() => {
			inbox.setThreadReadStatus($scope.selectedTid);
		}, consts.SET_READ_AFTER_TIMEOUT);

	$scope.$on('$destroy', () => {
		if (markAsReadTimeout)
			$timeout.cancel(markAsReadTimeout);
	});
};
