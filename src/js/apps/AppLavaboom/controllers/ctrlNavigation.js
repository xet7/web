module.exports = /*@ngInject*/($rootScope, $scope, $state, inbox, user, Hotkey) => {
	$scope.$state = $state;

	$scope.$bind('inbox-labels', () => {
		$scope.labelsByName = inbox.labelsByName;
	});

	$scope.logout = () => {
		user.logout();
	};
};