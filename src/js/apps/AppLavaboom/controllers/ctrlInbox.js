module.exports = /*@ngInject*/($rootScope, $scope, $state, $timeout, $interval, $stateParams, $translate, co, user, inbox, consts, hotkey) => {
	$scope.labelName = $stateParams.labelName;
	$scope.selectedTid = $stateParams.threadId ? $stateParams.threadId : null;
	if ($scope.selectedTid)
		inbox.selectedTidByLabelName[$scope.labelName] = $scope.selectedTid;

	console.log('CtrlInbox loaded', $scope.selectedTid);

	$scope.threads = {};
	$scope.threadsList = [];
	$scope.emails = {
		list: [],
		isLoading: false
	};

	$scope.searchText = '';

	$scope.isLoading = false;
	$scope.isLoadingSign = false;
	$scope.isDisabledScroll = true;
	$scope.isInitialLoad = true;
	$scope.isThreads = false;

	$scope.offset = 0;
	$scope.limit = 15;

	$scope.status = {
		isSortOpened: false
	};
	$scope.sortedLabel = '';
	$scope.sortQuery = inbox.getSortQuery();

	const translations = {
		LB_SORT_BY_CREATION_DATE_DESC : '',
		LB_SORT_BY_CREATION_DATE_ASC : '',
		LB_SORT_BY_MODIFICATION_DATE_DESC : '',
		LB_SORT_BY_MODIFICATION_DATE_ASC : '',
		LB_SORTED_BY_CREATION_DATE_DESC : '',
		LB_SORTED_BY_CREATION_DATE_ASC : '',
		LB_SORTED_BY_MODIFICATION_DATE_DESC : '',
		LB_SORTED_BY_MODIFICATION_DATE_ASC : ''
	};

	$translate.bindAsObject(translations, 'INBOX', null, () => {
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
	let setLoadingSignTimeout = null;

	const requestList = () => {
		if ($scope.isLoading)
			return;

		$scope.isLoading = true;
		setLoadingSignTimeout = $timeout(() => {
			$scope.isLoadingSign = true;
		}, consts.LOADER_SHOW_DELAY);

		const labelName = $scope.labelName;

		return co(function *(){
			try {
				const list = yield inbox.requestList($scope.labelName, $scope.offset, $scope.limit);

				if (labelName == $scope.labelName) {
					$scope.isDisabledScroll = list.length < 1;
					$scope.offset += list.length;
				}
			} catch (err) {
				$scope.isDisabledScroll = true;
				throw err;
			}
		});
	};

	$scope.sortThreads = (sortQuery) => {
		$scope.sortQuery = sortQuery;
		inbox.setSortQuery(sortQuery);

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

			console.log('inbox-threads selectedIndex 1: ', selectedIndex);

			$scope.threadsList = threadsList;

			if (!$scope.threadsList || $scope.threadsList.length < 1)
				$state.go('main.inbox.label', {labelName: $scope.labelName, threadId: null});
			else
			if (selectedIndex > -1 && $scope.threadsList.findIndex(thread => thread.id == $scope.selectedTid) < 0) {
				selectedIndex = Math.min(Math.max(selectedIndex, 0), $scope.threadsList.length - 1);
				$scope.selectThread($scope.threadsList[selectedIndex].id);
			}

			console.log('inbox-threads selectedIndex 2: ', selectedIndex);

			$scope.threads = $scope.threadsList.reduce((a, t) => {
				a[t.id] = t;
				return a;
			}, {});

			if (setLoadingSignTimeout) {
				$timeout.cancel(setLoadingSignTimeout);
				setLoadingSignTimeout = null;
			}

			$scope.isLoading = false;
			$scope.isLoadingSign = false;
			$scope.isInitialLoad = false;
			$scope.isThreads = true;

			if (!watchingFilteredThreadsList) {
				let emails = null;
				let emailsSelectedTid = null;

				watchingFilteredThreadsList = $scope.$watch('filteredThreadsList', (o, n) => {
					if (o == n)
						return;

					const r = $scope.filteredThreadsList.find(t => t.id == $scope.selectedTid);
					if (!r) {
						emails = $scope.emails.list;
						emailsSelectedTid = $scope.selectedTid;
						$scope.emails.list = [];
					} else if (emails && $scope.selectedTid == emailsSelectedTid) {
						$scope.emails.list = emails;
					}
				});
			}

			$rootScope.$broadcast(`inbox-threads-received`, labelName);
		});
	});

	$rootScope.$on('$stateChangeStart', (e, toState, toParams) => {
		console.log('CtrlThreadList $stateChangeStart', toState.name, toParams);

		if (toState.name == 'main.inbox.label') {
			$scope.selectedTid = toParams.threadId ? toParams.threadId : null;

			if (toParams.labelName != $scope.labelName) {
				if (setLoadingSignTimeout) {
					$timeout.cancel(setLoadingSignTimeout);
					setLoadingSignTimeout = null;
				}

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
		if ($scope.isLoading || $scope.isDisabledScroll)
			return;

		requestList();
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

		hotkey.addHotkey({
			combo: ['h', 'k', 'left', 'up'],
			description: 'HOTKEY.MOVE_UP',
			callback: moveUp
		});

		hotkey.addHotkey({
			combo: ['j', 'l', 'right', 'down'],
			description: 'HOTKEY.MOVE_DOWN',
			callback: moveDown
		});

		hotkey.addHotkey({
			combo: 'a',
			description: 'HOTKEY.ARCHIVE_EMAIL',
			callback: (event, key) => {
				event.preventDefault();
				//$scope.archive($scope.selectedTid);
			}
		});

		hotkey.addHotkey({
			combo: 'd',
			description: 'HOTKEY.DELETE_EMAIL',
			callback: (event, key) => {
				event.preventDefault();
				$scope.deleteThread($scope.selectedTid);
			}
		});

		hotkey.addHotkey({
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