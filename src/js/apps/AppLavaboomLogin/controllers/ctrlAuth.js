angular.module('AppLavaboomLogin').controller('CtrlAuth', function($scope, $window, user) {
    $scope.auth = {
		username: '',
		password: '',
		isRemember: false
	};
	$scope.isProcessing = false;
	$scope.errorMessage = '';

    $scope.logIn = function() {
		$scope.isProcessing = true;
		user.singIn($scope.auth.username, $scope.auth.password)
			.finally(() => {
				$scope.isProcessing = false;
			});
	};

	$scope.$on('user-authenticated', () => {
		user.persistAuth($scope.auth.isRemember);

		$window.location = '/';
	});

	$scope.$on('user-authentication-error', (e, err) => {
		$scope.errorMessage = err.body.message;
	});
});
