module.exports = /*@ngInject*/($scope, $state, inbox, user) => {
	$scope.$state = $state;

	$scope.$bind('inbox-labels', () => {
		$scope.labelsByName = inbox.labelsByName;
	});

	$scope.logout = () => {
		user.logout();
	};
};