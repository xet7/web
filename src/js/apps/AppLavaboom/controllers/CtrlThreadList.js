angular.module(primaryApplicationName).controller('CtrlThreadList', function($rootScope, $document, $scope, $timeout, $interval, $stateParams, user, inbox, consts) {
	$scope.labelName = $stateParams.labelName;
	$scope.searchText = '';

	$scope.searchFilter = (thread) => {
		var searchText = $scope.searchText.toLowerCase();
		return thread.subject.toLowerCase().indexOf(searchText) > -1 || thread.members.some(m => m.toLowerCase().indexOf(searchText) > -1);
	};

	$scope.$bind(`inbox-threads[${$scope.labelName}]`, () => {
		var selectedIndex = $scope.threadsList && $scope.selectedTid !== null
			? $scope.threadsList.findIndex(thread => thread.id == $scope.selectedTid)
			: -1;

		$scope.threads = angular.copy(inbox.threads);
		$scope.threadsList = angular.copy(inbox.threadsList);

		if ($scope.selectedTid !== null) {
			if ($scope.threadsList.length > 0) {
				selectedIndex = Math.min(Math.max(selectedIndex, 0), $scope.threadsList.length - 1);
				$scope.selectedTid = $scope.threadsList[selectedIndex].id;
			} else
				$scope.selectedTid = null;
		}

		$scope.isLoading = false;
		$scope.isDisabled = false;
	});

	$scope.isLoading = false;
	$scope.isDisabled = true;
	$scope.selectedTid = $stateParams.threadId ? $stateParams.threadId : null;

	console.log('mail list reload', $scope.selectedTid);

	$rootScope.$on('$stateChangeStart', (e, toState, toParams) => {
		if (toState.name == 'main.inbox.label' && toParams.threadId)
			$scope.selectedTid = toParams.threadId;
		console.log('mail list reload $stateChangeStart', $scope.selectedTid);
	});

	$document.bind('keydown', (event) => $rootScope.$apply(() => {
		var delta = 0;
		if (event.keyIdentifier == 'Up')
			delta = -1;
		else if (event.keyIdentifier == 'Down')
			delta = +1;

		if (delta) {
			var selectedIndex = $scope.threadsList && $scope.selectedTid !== null
				? $scope.threadsList.findIndex(thread => thread.id == $scope.selectedTid)
				: -1;

			if ($scope.selectedTid !== null) {
				selectedIndex = Math.min(Math.max(selectedIndex + delta, 0), $scope.threadsList.length - 1);
				$scope.selectedTid = $scope.threadsList[selectedIndex].id;
			}

			event.preventDefault();
		}
	}));

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

	var requestList = () => {
		var t = $timeout(() => {
			$scope.isLoading = true;
		}, consts.LOADER_SHOW_DELAY);

		inbox.requestList($scope.labelName)
			.then((e) => {
				$scope.isDisabled = e.list.length < 1;
			})
			.finally(() => {
				$timeout.cancel(t);
			});
	};

	$rootScope.whenInitialized(() => {
		requestList();
	});
});