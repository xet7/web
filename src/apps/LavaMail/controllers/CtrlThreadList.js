module.exports = /*@ngInject*/($rootScope, $scope, $state, $timeout, $interval, $translate,
							   co, utils, consts, hotkey, user, inbox) => {

	$scope.labelName = utils.capitalize($state.params.labelName);
	$scope.selectedTid = $state.params.threadId ? $state.params.threadId : (
		inbox.selectedTidByLabelName[$scope.labelName]
			? inbox.selectedTidByLabelName[$scope.labelName]
			: null
	);

	$scope.threads = {};
	$scope.threadsList = [];
	$scope.searchText = '';

	$scope.isLoading = false;
	$scope.isLoadingSign = false;
	$scope.isDisabledScroll = true;
	$scope.isThreads = false;

	$scope.offset = 0;
	$scope.limit = 15;

	$scope.status = {
		isSortOpened: false
	};
	$scope.sortedLabel = '';
	$scope.sortQuery = inbox.getSortQuery();

	console.log('CtrlThreadList is loading', $scope.labelName, $scope.selectedTid);

	let setLoadingSignTimeout = null;

	{
		let emailsSelectedTid = null;

		$scope.$watch('filteredThreadsList', (o, n) => {
			if (o == n)
				return;

			const r = $scope.filteredThreadsList.find(t => t.id == $scope.selectedTid);
			if (!r) {
				emailsSelectedTid = $scope.selectedTid;
				$rootScope.$broadcast('inbox-emails-clear');
			} else if ($scope.selectedTid == emailsSelectedTid) {
				$rootScope.$broadcast('inbox-emails-restore');
			}
		});
	}

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

	const requestList = () => {
		if ($scope.isLoading)
			return;

		$scope.isLoading = true;
		if ($scope.threadsList.length > 0)
			$scope.isLoadingSign = true;
		else
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
		$state.go('main.inbox.label', {threadId: tid});
		$scope.selectedTid = tid;
	};

	$scope.replyThread = (event, tid) => {
		$scope.showPopup('compose', {replyThreadId: tid});
	};

	$scope.deleteThread = (tid) => {
		console.log('deleteThread', tid, $scope.threads[tid]);
		inbox.requestDelete($scope.threads[tid]);
	};

	$scope.searchFilter = (thread) => {
		let searchText = $scope.searchText.toLowerCase();
		return thread.subject.toLowerCase().includes(searchText)
			|| thread.membersPretty.join(',').toLowerCase().includes(searchText);
	};

	$scope.$on('$stateChangeStart', (e, toState, toParams) => {
		if (toState.name == 'main.inbox.label')
			$scope.selectedTid = toParams.threadId ? toParams.threadId : null;
	});

	$scope.$on(`inbox-threads`, (e, labelName) => co(function *(){
		console.log('inbox-threads', labelName);

		try {
			const threadsList = yield inbox.requestListDirect($scope.labelName, 0, $scope.offset + $scope.limit);

			let selectedIndex = $scope.threadsList && $scope.selectedTid !== null
				? $scope.threadsList.findIndex(thread => thread.id == $scope.selectedTid)
				: -1;

			console.log('inbox-threads selectedIndex 1: ', selectedIndex);

			$scope.threadsList = threadsList;

			if (!$scope.threadsList || $scope.threadsList.length < 1)
				$state.go('main.inbox.label', {labelName: $scope.labelName.toLowerCase(), threadId: null});
			else if (selectedIndex > -1 && $scope.threadsList.findIndex(thread => thread.id == $scope.selectedTid) < 0) {
				selectedIndex = Math.min(Math.max(selectedIndex, 0), $scope.threadsList.length - 1);
				$scope.selectThread($scope.threadsList[selectedIndex].id);
			}

			console.log('inbox-threads selectedIndex 2: ', selectedIndex);

			$scope.threads = utils.toMap($scope.threadsList);
		} finally {
			if (setLoadingSignTimeout) {
				$timeout.cancel(setLoadingSignTimeout);
				setLoadingSignTimeout = null;
			}

			$scope.isLoading = false;
			$scope.isLoadingSign = false;
			$scope.isThreads = true;
		}
	}));

	$scope.scroll = () => {
		console.log('scroll()', $scope.isLoading, $scope.isDisabledScroll);
		if ($scope.isLoading || $scope.isDisabledScroll)
			return;

		requestList();
	};

	requestList();

	{
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

		hotkey.registerCustomHotkeys($scope, [
			{
				combo: ['h', 'k', 'left', 'up'],
				description: 'HOTKEY.MOVE_UP',
				callback: (event, key) => {
					event.preventDefault();
					moveThreads(-1);
				}
			},

			{
				combo: ['j', 'l', 'right', 'down'],
				description: 'HOTKEY.MOVE_DOWN',
				callback: (event, key) => {
					event.preventDefault();
					moveThreads(1);
				}
			},

			{
				combo: 'a',
				description: 'HOTKEY.ARCHIVE_EMAIL',
				callback: (event, key) => {
					event.preventDefault();
					//$scope.archive($scope.selectedTid);
				}
			},

			{
				combo: ['d', 'backspace'],

				description: 'HOTKEY.DELETE_EMAIL',
				callback: (event, key) => {
					console.log('d');
					event.preventDefault();
					$scope.deleteThread($scope.selectedTid);
				}
			},

			{
				combo: 'r',
				description: 'HOTKEY.REPLY_EMAIL',
				callback: (event, key) => {
					console.log('к');
					event.preventDefault();
					$scope.replyThread(event, $scope.selectedTid);
				}
			}
		], {scope: 'ctrlThreadList'});
	}
};