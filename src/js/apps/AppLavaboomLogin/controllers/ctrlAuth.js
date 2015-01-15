angular.module('AppLavaboomLogin').controller('CtrlAuth', function($scope, $rootScope, $window, $interval, user) {
    $scope.form = {
		username: '',
		password: '',
		isRemember: false
	};
	$scope.isProcessing = false;

    $scope.logIn = () => {
		$scope.isProcessing = true;
		user.signIn($scope.form.username, $scope.form.password)
			.finally(() => {
				$scope.isProcessing = false;
			});
	};

	$scope.$on('user-authenticated', () => {
		user.persistAuth($scope.form.isRemember);

		$window.location = '/';
	});
});
