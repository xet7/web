angular.module(primaryApplicationName).controller('CtrlMailList', function($rootScope, $document, $scope, $timeout, $interval, $stateParams, user, inbox, cryptoKeys) {
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

		console.log('$scope.selectedTid', $scope.selectedTid);

		if ($scope.selectedTid !== null && $scope.threadsList.length > 0) {
			selectedIndex = Math.min(Math.max(selectedIndex, 0), $scope.threadsList.length - 1);
			$scope.selectedTid = $scope.threadsList[selectedIndex].id;
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
				$scope.isDisabled = e.list.length < 1;
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