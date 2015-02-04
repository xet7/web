angular.module(primaryApplicationName).controller('CtrlMailList', function($rootScope, $document, $scope, $timeout, $interval, $stateParams, user, inbox, cryptoKeys) {
	$scope.labelName = $stateParams.labelName;

	$scope.$bind(`inbox-threads[${$scope.labelName}]`, () => {
		var selectedIndex = $scope.threadIdsList && $scope.selectedTid !== null
			? $scope.threadIdsList.findIndex(threadId => threadId == $scope.selectedTid)
			: -1;

		$scope.threads = angular.copy(inbox.threads);
		$scope.threadIdsList = angular.copy(inbox.threadIdsList);

		if ($scope.selectedTid !== null) {
			selectedIndex = Math.min(Math.max(selectedIndex, 0), $scope.threadIdsList.length - 1);
			$scope.selectedTid = $scope.threadIdsList[selectedIndex];
		}

		$scope.isLoading = false;
	});

	$scope.isLoading = true;
	$scope.isDisabled = false;
	$scope.selectedTid = null;

	$document.bind("keydown", (event) => $rootScope.$apply(() => {
		var delta = 0;
		if (event.keyIdentifier == 'Up')
			delta = -1;
		else if (event.keyIdentifier == 'Down')
			delta = +1;

		if (delta) {
			var selectedIndex = $scope.threadIdsList && $scope.selectedTid !== null
				? $scope.threadIdsList.findIndex(threadId => threadId == $scope.selectedTid)
				: -1;

			if ($scope.selectedTid !== null) {
				selectedIndex = Math.min(Math.max(selectedIndex + delta, 0), $scope.threadIdsList.length - 1);
				$scope.selectedTid = $scope.threadIdsList[selectedIndex];
			}

			event.preventDefault();
		}
	}));

	$scope.scroll = () => {
		if ($scope.isLoading || $scope.isDisabled)
			return;

		requestList();
	};

	$scope.choose = (tid) => {
		console.log('$scope.selectedTid', tid);
		$scope.selectedTid = tid;
	};

	$scope.spamThread = () => {
		inbox.requestSetLabel($scope.selectedTid, 'Spam');
	};

	$scope.deleteThread = () => {
		inbox.requestDelete($scope.selectedTid);
	};

	$scope.starThread = () => {
		inbox.requestAddLabel($scope.selectedTid, 'Starred');
	};

	var requestList = () => {
		$scope.isLoading = true;
		inbox.requestList($scope.labelName)
			.then((e) => {
				$scope.isDisabled = e.ids.length < 1;
			});
	};

	if ($scope.isInitialized) {
		requestList();
	}
	else
		$rootScope.$on('initialization-completed', () => {
			requestList();
		});

	$scope.$watch('selectedTid', () => {
		$rootScope.$broadcast('inbox-selection-changed', $scope.selectedTid);
	});
});