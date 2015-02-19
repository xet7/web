module.exports = /*@ngInject*/($rootScope, $document, $scope, $state, $timeout, $interval, $stateParams, user, inbox, consts, hotkeys) => {
	$scope.labelName = $stateParams.labelName;
	$scope.selectedTid = $stateParams.threadId ? $stateParams.threadId : null;
	$scope.$state = $state;

	console.log('CtrlThreadList loaded', $scope.selectedTid);

	$scope.searchText = '';
	$scope.isLoading = false;
	$scope.isDisabled = true;
	$scope.isInitialLoad = true;

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

	$scope.$bind(`inbox-threads[${$scope.labelName}]`, () => {
		$scope.threads = angular.copy(inbox.threads);
		$scope.threadsList = angular.copy(inbox.threadsList);

		$scope.isLoading = false;
		$scope.isDisabled = false;
		$scope.isInitialLoad = false;
	});

	$rootScope.$on('$stateChangeStart', (e, toState, toParams) => {
		if (toState.name == 'main.inbox.label' && toParams.threadId)
			$scope.selectedTid = toParams.threadId;
		console.log('CtrlThreadList $stateChangeStart', $scope.selectedTid);
	});

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
				$scope.isLoading = false;
				$scope.isDisabled = false;
				$timeout.cancel(t);
			});
	};

	requestList();

    // Add hotkeys
    var moveThreads = function(delta) {
        var selectedIndex = $scope.threadsList && $scope.selectedTid !== null
            ? $scope.threadsList.findIndex(thread => thread.id == $scope.selectedTid)
        : -1;
        if ($scope.selectedTid !== null) {
            selectedIndex = Math.min(Math.max(selectedIndex + delta, 0), $scope.threadsList.length - 1);
            $scope.selectedTid = $scope.threadsList[selectedIndex].id;
            $scope.selectThread(null, $scope.selectedTid);
        }
    };

    var moveUp = function(event, key) {
        event.preventDefault();
        moveThreads(-1);
    };

    var moveDown = function(event, key) {
        event.preventDefault();
        moveThreads(1);
    };

    for (let key of ['h', 'k', 'left', 'up']) {
        hotkeys.add({
            combo: key,
            description: 'Move up',
            callback: moveUp
        });
    }

    for (let key of ['j', 'l', 'right', 'down']) {
        hotkeys.add({
            combo: key,
            description: 'Move down',
            callback: moveDown
        });
    }

    hotkeys.add({
        combo: 'a',
        description: 'Archive selected email',
        callback: (event, key) => {
            event.preventDefault();
            $scope.deleteThread($scope.selectedTid);
        }
    });

    hotkeys.add({
        combo: 'd',
        description: 'Delete selected email',
        callback: (event, key) => {
            event.preventDefault();
            $scope.deleteThread($scope.selectedTid);
        }
    });

    hotkeys.add({
        combo: 'r',
        description: 'Reply to selected email',
        callback: (event, key) => {
            event.preventDefault();
            $scope.replyThread(event, $scope.selectedTid);
        }
    });

};