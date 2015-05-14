module.exports = /*@ngInject*/($rootScope, $scope, $state, co, inbox, user, hotkey) => {
	$scope.$state = $state;
	$scope.name = user.styledName;

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