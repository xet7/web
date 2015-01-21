angular.module(primaryApplicationName).controller('CtrlNavigation', function($scope, inbox, user) {
	$scope.labels = inbox.labels;

	$scope.$on('inbox-labels', (e, labels) => {
		$scope.labels = labels;
	});

	$scope.composeTest = () => {
		inbox.send(user.email, 'test PGP subject', 'test PGP body');
	};

	$scope.logout = () => {
		user.logout();
	};
});
