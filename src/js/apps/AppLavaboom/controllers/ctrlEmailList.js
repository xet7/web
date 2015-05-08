module.exports = /*@ngInject*/($rootScope, $scope, $timeout, $state, $stateParams, $translate, $sanitize,
							   user, utils, co, inbox, saver) => {

	$scope.selfEmail = user.email;
	$scope.labelName = $stateParams.labelName;
	$scope.selectedTid = $stateParams.threadId ? $stateParams.threadId : null;
	inbox.selectedTidByLabelName[$scope.labelName] = $scope.selectedTid;

	$scope.isThreads = false;
	$scope.isLoading = false;

	{
		let list = inbox.requestListCached($scope.labelName);
		console.log('requestListCached', list);
		$scope.threads = list ? utils.toMap(list) : {};
		$scope.isThreads = Object.keys($scope.threads).length > 0;
	}

	console.log('CtrlEmailList is loading', $scope.labelName, $scope.selectedTid);

	$scope.$on(`inbox-threads-ready`, (e, labelName, threads) => {
		$scope.threads = utils.toMap(threads);
		$scope.isThreads = true;
	});

	const translations = {
		TITLE_CONFIRM: '',
		LB_EMAIL_HAS_EMBEDDED_STYLING: ''
	};
	$translate.bindAsObject(translations, 'INBOX');

	$scope.downloadEmail = (email, name, isHtml) => {
		let contentType = isHtml ? 'text/html' : 'text/plain';

		saver.saveAs(email, name + (isHtml ? '.html' : '.txt'), contentType);
	};

	$scope.openEmail = (email, isHtml) => {
		let contentType = isHtml ? 'text/html' : 'text/plain';

		saver.openAs(email, contentType);
	};

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

	$scope.$on('inbox-new', (e, threadId) => {
		if (threadId == $scope.selectedTid)
			inbox.setThreadReadStatus($scope.selectedTid);
	});

	if ($scope.selectedTid) {
		$scope.emails = [];
		$scope.isLoading = true;

		console.log('emails has selected tid', $scope.selectedTid);

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

				yield utils.wait(() => $scope.isThreads);

				$scope.emails = (yield emailsPromise).map(e => {
					e.originalBodyData = e.body.data;
					return e;
				});

				inbox.setThreadReadStatus($scope.selectedTid);
			} finally {
				$scope.isLoading = false;
			}
		});
	}

	$scope.$on('inbox-emails', (e, threadId) => {
		if (threadId != $scope.selectedTid)
			return;

		co(function *() {
			$scope.isLoading = true;
			try {
				$scope.emails = (yield inbox.getEmailsByThreadId(threadId)).map(e => {
					e.originalBodyData = e.body.data;
					return e;
				});
			} finally {
				$scope.isLoading = false;
			}
		});
	});

	let emailsBeforeSearch = [];

	$scope.$on('inbox-emails-clear', () => {
		emailsBeforeSearch = $scope.emails;
		$scope.emails = [];
	});

	$scope.$on('inbox-emails-restore', () => {
		if (emailsBeforeSearch && emailsBeforeSearch.length > 0) {
			$scope.emails = emailsBeforeSearch;
			emailsBeforeSearch = [];
		}
	});
};
