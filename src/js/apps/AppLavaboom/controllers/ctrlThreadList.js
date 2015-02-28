module.exports = /*@ngInject*/($rootScope, $scope, $state, $timeout, $interval, $stateParams, co, user, inbox, consts, Hotkey) => {
	$scope.labelName = $stateParams.labelName;
	$scope.selectedTid = $stateParams.threadId ? $stateParams.threadId : null;
	$scope.$state = $state;

	console.log('CtrlThreadList loaded', $scope.selectedTid);

	$scope.searchText = '';
	$scope.isLoading = false;
	$scope.isLoadingSign = false;
	$scope.isDisabled = true;
	$scope.isInitialLoad = true;

	$scope.offset = 0;
	$scope.limit = 15;

	const requestList = () => {
		$scope.isLoading = true;
		let t = $timeout(() => {
			$scope.isLoadingSign = true;
		}, consts.LOADER_SHOW_DELAY);

		const labelName = $scope.labelName;
		co(function *(){
			try {
				let e = yield inbox.requestList($scope.labelName, $scope.offset, $scope.limit);

				if (labelName == $scope.labelName) {
					$scope.isDisabled = e.list.length < 1;
					$scope.offset += e.list.length;
				}
			} catch (err) {
				$scope.isDisabled = true;
			} finally {
				if (labelName == $scope.labelName) {
					$scope.isLoading = false;
					$scope.isLoadingSign = false;
					$timeout.cancel(t);
				}
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
		let searchText = $scope.searchText.toLowerCase();
		return thread.subject.toLowerCase().includes(searchText) || thread.members.some(m => m.toLowerCase().includes(searchText));
	};

	$scope.$bind(`inbox-threads`, (e) => {
		console.log($scope.labelName, inbox.threadsList);
		$scope.threads = inbox.threads;
		$scope.threadsList = inbox.threadsList[$scope.labelName];

		console.log('$scope.threadsList', $scope.threadsList);

		if (!$scope.threadsList || $scope.threadsList.length < 1)
			$state.go('main.inbox.label', {labelName: $scope.labelName});

		$scope.isLoading = false;
		$scope.isLoadingSign = false;
		$scope.isInitialLoad = false;
	});

	$scope.$watch('filteredThreadsList', (o, n) => {
		if (o == n)
			return;

		const r = $scope.filteredThreadsList.find(t => t.id == $scope.selectedTid);
		if (!r)
			$rootScope.$broadcast('emails-list-hide');
		else
			$rootScope.$broadcast('emails-list-restore');
	});

	$rootScope.$on('$stateChangeStart', (e, toState, toParams) => {
		console.log('CtrlThreadList $stateChangeStart', toState.name, toParams);

		if (toState.name == 'main.inbox.label') {
			$scope.selectedTid = toParams.threadId ? toParams.threadId : null;
			if (toParams.labelName != $scope.labelName) {
				$scope.offset = 0;
				$scope.limit = 15;
				$scope.threads = {};
				$scope.threadsList = [];
				$scope.labelName = toParams.labelName;
				requestList();
			}
			addHotkeys();
		}
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

	requestList();

    // Add hotkeys
	const addHotkeys = () => {
		const moveThreads = (delta) => {
			let selectedIndex = $scope.threadsList && $scope.selectedTid !== null
				? $scope.threadsList.findIndex(thread => thread.id == $scope.selectedTid)
				: -1;
			if ($scope.selectedTid !== null) {
				selectedIndex = Math.min(Math.max(selectedIndex + delta, 0), $scope.threadsList.length - 1);
				$scope.selectedTid = $scope.threadsList[selectedIndex].id;
				$scope.selectThread(null, $scope.selectedTid);
			}
		};

		const moveUp = (event, key) => {
			event.preventDefault();
			moveThreads(-1);
		};

		const moveDown = (event, key) => {
			event.preventDefault();
			moveThreads(1);
		};
		
		Hotkey.addHotkey({
			combo: ['h', 'k', 'left', 'up'],
			description: 'HOTKEY.MOVE_UP',
			callback: moveUp
		});

		Hotkey.addHotkey({
			combo: ['j', 'l', 'right', 'down'],
			description: 'HOTKEY.MOVE_DOWN',
			callback: moveDown
		});

		Hotkey.addHotkey({
			combo: 'a',
			description: 'HOTKEY.ARCHIVE_EMAIL',
			callback: (event, key) => {
				event.preventDefault();
				//$scope.archive($scope.selectedTid);
			}
		});

		Hotkey.addHotkey({
			combo: 'd',
			description: 'HOTKEY.DELETE_EMAIL',
			callback: (event, key) => {
				event.preventDefault();
				$scope.deleteThread($scope.selectedTid);
			}
		});

		Hotkey.addHotkey({
			combo: 'r',
			description: 'HOTKEY.REPLY_EMAIL',
			callback: (event, key) => {
				event.preventDefault();
				$scope.replyThread(event, $scope.selectedTid);
			}
		});
	};

	addHotkeys();
};