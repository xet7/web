module.exports = /*@ngInject*/($rootScope, $scope, $state, co, inbox, user) => {
	$scope.$state = $state;

	co(function *(){
		$scope.labelsByName = (yield inbox.getLabels()).byName;
	});

	$scope.getThreadForLabel = labelName => inbox.selectedTidByLabelName[labelName] ? inbox.selectedTidByLabelName[labelName] : null;

	$scope.$on('inbox-labels', (e, labels) => {
		$scope.labelsByName = labels.byName;
	});

	$scope.logout = () => {
		user.logout();
	};
};