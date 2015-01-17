angular.module(primaryApplicationName).controller('CtrlAuth', function($scope, $rootScope, $window, $interval, user) {
    $scope.form = {
		username: '',
		password: '',
		isRemember: true
	};
	$scope.isProcessing = false;

    $scope.logIn = () => {
		$scope.isProcessing = true;
		user.signIn($scope.form.username, $scope.form.password, $scope.form.isRemember)
			.finally(() => {
				$scope.isProcessing = false;
			});
	};

	$scope.$on('user-authenticated', () => {
		$window.location = '/';
	});
});
