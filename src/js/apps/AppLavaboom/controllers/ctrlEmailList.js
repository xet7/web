module.exports = /*@ngInject*/($rootScope, $scope, $timeout, $state, $stateParams, utils, co, inbox, consts, notifications) => {
	console.log('loading emails list', $stateParams.threadId);

	$scope.isLoading = false;
	$scope.labelName = $stateParams.labelName;
	$scope.selectedTid = $stateParams.threadId;
	$scope.emails = [];

	$scope.notifications = [];
	$rootScope.$bind('notifications', () => {
		$scope.notifications = notifications.get();
	});

	let isThreads = false;

	const setRead = () => co(function *(){
		yield utils.sleep(consts.SET_READ_AFTER_TIMEOUT);
		if ($scope.$$destroyed)
			return;
		inbox.setThreadReadStatus($scope.selectedTid);
	});

	$rootScope.$on('inbox-new', (e, threadId) => {
		if (threadId == $scope.selectedTid)
			setRead();
	});

	$rootScope.$on(`inbox-threads-received`, (e, labelName) => {
		if ($scope.labelName == labelName)
			isThreads = true;
	});

	$rootScope.$broadcast(`inbox-threads-status-request`, $scope.labelName, $scope.selectedTid);

	if ($scope.selectedTid) {
		let t = $timeout(() => {
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

				yield utils.wait(() => isThreads);

				$scope.emails = yield emailsPromise;

				setRead();
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
