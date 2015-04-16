module.exports = /*@ngInject*/($rootScope, $scope, $timeout, $state, $stateParams, $translate, $sanitize,
							   utils, co, inbox, consts, dialogs) => {
	console.log('loading emails list', $stateParams.threadId);

	const setRead = () => co(function *(){
		yield utils.sleep(consts.SET_READ_AFTER_TIMEOUT);
		if ($scope.$$destroyed)
			return;
		inbox.setThreadReadStatus($scope.selectedTid);
	});

	const translations = {
		TITLE_CONFIRM: '',
		LB_EMAIL_HAS_EMBEDDED_STYLING: ''
	};
	$translate.bindAsObject(translations, 'INBOX');

	$scope.restoreFromSpam = (tid) => {
		console.log('restoreFromSpam', tid, $scope.threads[tid]);
		inbox.requestRestoreFromSpam($scope.threads[tid]);
	};

	$scope.restoreFromTrash = (tid) => {
		console.log('restoreFromTrash', tid, $scope.threads[tid]);
		inbox.requestRestoreFromTrash($scope.threads[tid]);
	};

	$scope.spamThread = (tid) => {
		console.log('spamThread', tid, $scope.threads[tid]);
		inbox.requestAddLabel($scope.threads[tid], 'Spam');
	};

	$scope.deleteThread = (tid) => {
		console.log('deleteThread', tid, $scope.threads[tid]);
		inbox.requestDelete($scope.threads[tid]);
	};

	$scope.starThread = (tid) => {
		console.log('starThread', tid, $scope.threads[tid]);
		inbox.requestSwitchLabel($scope.threads[tid], 'Starred');
	};

	$rootScope.$on('inbox-new', (e, threadId) => {
		if (threadId == $scope.selectedTid)
			setRead();
	});

	if ($scope.selectedTid) {
		$scope.emails.list = [];
		$scope.emails.isLoading = true;

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

				console.log('wait $scope.isThreads', $scope.isThreads);

				yield utils.wait(() => $scope.isThreads);

				$scope.emails.list = yield emailsPromise;

				setRead();
			} finally {
				$scope.emails.isLoading = false;
			}
		});
	}

	$rootScope.$on('inbox-emails', (e, threadId) => {
		if (threadId != $scope.selectedTid)
			return;

		co(function *() {
			$scope.emails.isLoading = true;
			try {
				$scope.emails.list = yield inbox.getEmailsByThreadId(threadId);
			} finally {
				$scope.emails.isLoading = false;
			}
		});
	});
};
