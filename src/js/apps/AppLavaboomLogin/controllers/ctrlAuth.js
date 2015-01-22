angular.module(primaryApplicationName).controller('CtrlAuth', function($scope, $rootScope, $window, $interval, user, loader) {
    $scope.form = {
		username: '',
		password: '',
		isRemember: true,
		isPrivateComputer: true
	};
	$scope.isProcessing = false;

    $scope.logIn = () => {
		$scope.isProcessing = true;
		user.signIn($scope.form.username, $scope.form.password, $scope.form.isRemember, $scope.form.isPrivateComputer)
			.then(() => {
				loader.resetProgress();
				loader.showLoader(true);
				loader.loadMainApplication();
			})
			.finally(() => {
				$scope.isProcessing = false;
			});
	};
});
