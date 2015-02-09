angular.module(primaryApplicationName).controller('CtrlNavigation', function($scope, $state, inbox, user) {
	$scope.$state = $state;

	console.log('CtrlNavigation loaded');

	$scope.$bind('inbox-labels', (e) => {
		$scope.labelsByName = inbox.labelsByName;
	});

	$scope.composeTest = () => {
		inbox.send(user.email, 'test PGP subject', 'test PGP body');
	};

	$scope.logout = () => {
		user.logout();
	};
});
