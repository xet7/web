module.exports = /*@ngInject*/($rootScope, $scope, $state, $timeout, $interval, $stateParams, $translate, co, user, inbox, consts, Hotkey) => {
	$scope.labelName = $stateParams.labelName;
	$scope.selectedTid = $stateParams.threadId ? $stateParams.threadId : null;
	if ($scope.selectedTid)
		inbox.selectedTidByLabelName[$scope.labelName] = $scope.selectedTid;

	console.log('CtrlThreadList loaded', $scope.selectedTid);

	$scope.threads = {};
	$scope.threadsList = [];
	$scope.searchText = '';
	$scope.isLoading = false;
	$scope.isLoadingSign = false;
	$scope.isDisabled = true;
	$scope.isInitialLoad = true;

	$scope.offset = 0;
	$scope.limit = 15;

	$scope.status = {
		isSortOpened: false
	};
	$scope.sortedLabel = '';
	$scope.sortQuery = inbox.sortQuery;

	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_SORT_BY_CREATION_DATE_DESC = $translate.instant('INBOX.LB_SORT_BY_CREATION_DATE_DESC');
		translations.LB_SORT_BY_CREATION_DATE_ASC = $translate.instant('INBOX.LB_SORT_BY_CREATION_DATE_ASC');
		translations.LB_SORT_BY_MODIFICATION_DATE_DESC = $translate.instant('INBOX.LB_SORT_BY_MODIFICATION_DATE_DESC');
		translations.LB_SORT_BY_MODIFICATION_DATE_ASC = $translate.instant('INBOX.LB_SORT_BY_MODIFICATION_DATE_ASC');
		translations.LB_SORTED_BY_CREATION_DATE_DESC = $translate.instant('INBOX.LB_SORTED_BY_CREATION_DATE_DESC');
		translations.LB_SORTED_BY_CREATION_DATE_ASC = $translate.instant('INBOX.LB_SORTED_BY_CREATION_DATE_ASC');
		translations.LB_SORTED_BY_MODIFICATION_DATE_DESC = $translate.instant('INBOX.LB_SORTED_BY_MODIFICATION_DATE_DESC');
		translations.LB_SORTED_BY_MODIFICATION_DATE_ASC = $translate.instant('INBOX.LB_SORTED_BY_MODIFICATION_DATE_ASC');

		$scope.sorts = [
			{
				query: '-date_created',
				label: translations.LB_SORT_BY_CREATION_DATE_DESC,
				labelSorted: translations.LB_SORTED_BY_CREATION_DATE_DESC
			},
			{
				query: '+date_created',
				label: translations.LB_SORT_BY_CREATION_DATE_ASC,
				labelSorted: translations.LB_SORTED_BY_CREATION_DATE_ASC
			},
			{
				query: '-date_modified',
				label: translations.LB_SORT_BY_MODIFICATION_DATE_DESC,
				labelSorted: translations.LB_SORTED_BY_MODIFICATION_DATE_DESC
			},
			{
				query: '+date_modified',
				label: translations.LB_SORT_BY_MODIFICATION_DATE_ASC,
				labelSorted: translations.LB_SORTED_BY_MODIFICATION_DATE_ASC
			}
		];

		const currentSort = $scope.sorts.find(s => s.query == $scope.sortQuery);
		$scope.sortedLabel = currentSort ? currentSort.labelSorted : '';
	});

	let watchingFilteredThreadsList = null;

	const requestList = () => {
		$scope.isLoading = true;
		let setLoadingSignTimeout = $timeout(() => {
			$scope.isLoadingSign = true;
		}, consts.LOADER_SHOW_DELAY);

		const labelName = $scope.labelName;

		return co(function *(){
			try {
				const list = yield inbox.requestList($scope.labelName, $scope.offset, $scope.limit);

				if (labelName == $scope.labelName) {
					$scope.isDisabled = list.length < 1;
					$scope.offset += list.length;
				}
			} catch (err) {
				$scope.isDisabled = true;
				throw err;
			} finally {
				$scope.isLoading = false;
				$scope.isLoadingSign = false;
				$timeout.cancel(setLoadingSignTimeout);
			}
		});
	};

	$scope.sortThreads = (sortQuery) => {
		console.log('sorting', sortQuery);
		$scope.sortQuery = inbox.sortQuery = sortQuery;
		inbox.invalidateThreadCache();

		$scope.offset = 0;
		$scope.limit = 15;
		$scope.threads = {};
		$scope.threadsList = [];
		requestList();
	};

	$scope.selectThread = (tid) => {
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

	$rootScope.$on(`inbox-threads`, (e, labelName) => {
		co (function *(){
			console.log('inbox-threads', labelName);

			if (labelName != $scope.labelName) {
				console.log(`inbox-threads data has been rejected (1) label should match to `, $scope.labelName);
				return;
			}

			const threadsList = yield inbox.requestListDirect($scope.labelName, 0, $scope.limit);

			if (labelName != $scope.labelName) {
				console.log(`inbox-threads data has been rejected (2) label should match to `, $scope.labelName);
				return;
			}

			let selectedIndex = $scope.threadsList && $scope.selectedTid !== null
				? $scope.threadsList.findIndex(thread => thread.id == $scope.selectedTid)
				: -1;

			$scope.threadsList = threadsList;

			if (!$scope.threadsList || $scope.threadsList.length < 1)
				$state.go('main.inbox.label', {labelName: $scope.labelName, threadId: null});
			else
			if (selectedIndex > -1) {
				selectedIndex = Math.min(Math.max(selectedIndex, 0), $scope.threadsList.length - 1);
				$scope.selectThread($scope.threadsList[selectedIndex].id);
			}

			$scope.threads = $scope.threadsList.reduce((a, t) => {
				a[t.id] = t;
				return a;
			}, {});

			$scope.isLoading = false;
			$scope.isLoadingSign = false;
			$scope.isInitialLoad = false;

			if (!watchingFilteredThreadsList) {
				watchingFilteredThreadsList = $scope.$watch('filteredThreadsList', (o, n) => {
					if (o == n)
						return;

					const r = $scope.filteredThreadsList.find(t => t.id == $scope.selectedTid);
					if (!r)
						$rootScope.$broadcast('emails-list-hide');
					else
						$rootScope.$broadcast('emails-list-restore');
				});
			}
		});
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
				$scope.isLoading = false;
				$scope.isLoadingSign = false;
				if (watchingFilteredThreadsList) {
					watchingFilteredThreadsList();
					watchingFilteredThreadsList = null;
				}
				requestList();
			}

			inbox.selectedTidByLabelName[$scope.labelName] = $scope.selectedTid;

			addHotkeys();
		}
	});

	$scope.scroll = () => {
		if ($scope.isLoading || $scope.isDisabled)
			return;

		requestList();
	};

	$scope.spamThread = (tid) => {
		inbox.requestSetLabel($scope.threads[tid], 'Spam');
	};

	$scope.deleteThread = (tid) => {
		inbox.requestDelete($scope.threads[tid]);
	};

	$scope.starThread = (tid) => {
		inbox.requestSwitchLabel($scope.threads[tid], 'Starred');
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
				$scope.selectThread($scope.selectedTid);
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