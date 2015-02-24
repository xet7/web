module.exports = /*@ngInject*/($rootScope, $scope, $state, $timeout, $interval, $stateParams, co, user, inbox, consts) => {
	$scope.labelName = $stateParams.labelName;
	$scope.selectedTid = $stateParams.threadId ? $stateParams.threadId : null;
	$scope.$state = $state;

	console.log('CtrlThreadList loaded', $scope.selectedTid);

	$scope.searchText = '';
	$scope.isLoading = false;
	$scope.isLoadingSign = false;
	$scope.isDisabled = true;
	$scope.isInitialLoad = true;

	var requestList = () => {
		$scope.isLoading = true;
		var t = $timeout(() => {
			$scope.isLoadingSign = true;
		}, consts.LOADER_SHOW_DELAY);

		co(function *(){
			try {
				let e = yield inbox.requestList($scope.labelName);
				$scope.isDisabled = e.list.length < 1;
			} catch (err) {
				$scope.isDisabled = true;
			} finally {
				$scope.isLoading = false;
				$scope.isLoadingSign = false;
				$timeout.cancel(t);
			}
		});
	};

	$scope.selectThread = (event, tid) => {
		$state.go('main.inbox.label', {labelName: $scope.labelName, threadId: tid});
	};

	$scope.replyThread = (event, tid) => {
		event.stopPropagation(); // god damn
		$scope.showPopup('compose', {replyThreadId: tid});
	};

	$scope.searchFilter = (thread) => {
		var searchText = $scope.searchText.toLowerCase();
		return thread.subject.toLowerCase().includes(searchText) || thread.members.some(m => m.toLowerCase().includes(searchText));
	};

	$scope.$bind(`inbox-threads`, (e, labelName) => {
		if (labelName != $scope.labelName)
			return;

		$scope.threads = angular.copy(inbox.threads);
		$scope.threadsList = angular.copy(inbox.threadsList);

		$scope.isLoading = false;
		$scope.isLoadingSign = false;
		$scope.isInitialLoad = false;
	});

	$rootScope.$on('$stateChangeStart', (e, toState, toParams) => {
		console.log('CtrlThreadList $stateChangeStart', toState.name, toParams);

		if (toState.name == 'main.inbox.label') {
			if (toParams.threadId)
				$scope.selectedTid = toParams.threadId;
			if (toParams.labelName != $scope.labelName) {
				$scope.threads = {};
				$scope.threadsList = [];
				$scope.labelName = toParams.labelName;
				requestList();
			}
		}
	});

	$scope.navigated = (delta) => {
		console.log('navigated', delta);

		var selectedIndex = $scope.threadsList && $scope.selectedTid !== null
			? $scope.threadsList.findIndex(e => e.id == $scope.selectedTid)
			: -1;

		if ($scope.selectedTid !== null) {
			selectedIndex = Math.min(Math.max(selectedIndex + delta, 0), $scope.threadsList.length - 1);

			$state.go('main.inbox.label', {labelName: $scope.labelName, threadId: $scope.threadsList[selectedIndex].id});
		}
	};

	$scope.scroll = () => {
		if ($scope.isLoading || $scope.isDisabled)
			return;

		requestList();
	};

	$scope.spamThread = (tid) => {
		inbox.requestSetLabel(tid, 'Spam');
	};

	$scope.deleteThread = (tid) => {
		inbox.requestDelete(tid);
	};

	$scope.starThread = (tid) => {
		inbox.requestSwitchLabel(tid, 'Starred');
	};

	requestList();
};