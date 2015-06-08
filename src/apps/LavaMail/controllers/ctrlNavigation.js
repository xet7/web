module.exports = ($rootScope, $scope, $state, $translate, co, inbox, user, hotkey) => {
	$scope.$state = $state;
	$scope.name = user.styledName;

	$scope.labelTranslations = {
		INBOX: '',
		SENT: '',
		STARRED: '',
		SPAM: '',
		TRASH: '',
		DRAFTS: ''
	};

	$translate.bindAsObject($scope.labelTranslations, 'LAVAMAIL.LABEL');

	co(function *(){
		$scope.labels = (yield inbox.getLabels()).list;
	});

	$scope.getThreadForLabel = labelName => inbox.selectedTidByLabelName[labelName] ? inbox.selectedTidByLabelName[labelName] : null;

	$scope.$on('inbox-labels', (e, labels) => {
		$scope.labels = labels.list;
	});

	$scope.isActive = (multiKey) => hotkey.isActive(multiKey);

	$scope.getMultiComboPrettified = (multiKey, name) => hotkey.getMultiComboPrettified(multiKey, name);

	$scope.logout = () => {
		user.logout();
	};
};