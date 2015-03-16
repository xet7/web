module.exports = /*@ngInject*/($rootScope, $scope, $state, co, inbox, user) => {
	$scope.$state = $state;

	co(function *(){
		$scope.labels = (yield inbox.getLabels()).list;
	});

	$scope.getThreadForLabel = labelName => inbox.selectedTidByLabelName[labelName] ? inbox.selectedTidByLabelName[labelName] : null;

	$scope.$on('inbox-labels', (e, labels) => {
		$scope.labels = labels.list;
	});

	$scope.logout = () => {
		user.logout();
	};
};