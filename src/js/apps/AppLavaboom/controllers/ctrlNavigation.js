module.exports = /*@ngInject*/($rootScope, $scope, $state, co, inbox, user, Hotkey) => {
	$scope.$state = $state;

	co(function *(){
		$scope.labelsByName = (yield inbox.getLabels()).byName;
	});

	$scope.$on('inbox-labels', (e, labels) => {
		$scope.labelsByName = labels.byName;
	});

	$scope.logout = () => {
		user.logout();
	};
};