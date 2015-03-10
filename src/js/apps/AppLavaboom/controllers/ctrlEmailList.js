module.exports = /*@ngInject*/($rootScope, $scope, $timeout, $state, $stateParams, co, inbox, consts) => {
	console.log('loading emails list', $stateParams.threadId);

	$scope.isLoading = false;

	$scope.labelName = $stateParams.labelName;
	$scope.selectedTid = $stateParams.threadId;
	$scope.emails = [];

	if ($scope.selectedTid) {
		var t = $timeout(() => {
			$scope.isLoading = true;
		}, consts.LOADER_SHOW_DELAY);

		$scope.emails = [];

		co(function *(){
			try {
				const threadPromise = inbox.getThreadById($scope.selectedTid);
				const emailsPromise = inbox.getEmailsByThreadId($scope.selectedTid);

				const thread = yield co.def(threadPromise, null);

				if (!thread || !thread.isLabel($scope.labelName)) {
					inbox.selectedTidByLabelName[$scope.labelName] = null;
					yield $state.go('main.inbox.label', {labelName: $scope.labelName, threadId: null});
					return;
				}

				$scope.emails = yield emailsPromise;

				const markAsReadTimeout = $timeout(() => {
						inbox.setThreadReadStatus($scope.selectedTid);
					}, consts.SET_READ_AFTER_TIMEOUT);

				$scope.$on('$destroy', () => {
					if (markAsReadTimeout)
						$timeout.cancel(markAsReadTimeout);
				});
			} finally {
				$timeout.cancel(t);
				$scope.isLoading = false;
			}
		});
	}

	let emails = null;

	$rootScope.$on('inbox-emails', (e, threadId) => {
		if (threadId != $scope.selectedTid)
			return;

		co(function *() {
			$scope.isLoading = true;
			try {
				$scope.emails = yield inbox.getEmailsByThreadId(threadId);
			} finally {
				$scope.isLoading = false;
			}
		});
	});

	$rootScope.$on('emails-list-hide', () => {
		emails = $scope.emails;
		$scope.emails = [];
	});

	$rootScope.$on('emails-list-restore', () => {
		if (emails)
			$scope.emails = emails;
	});
};
