angular.module(primaryApplicationName).controller('CtrlSecureUsername', function($scope, $state, signUp) {
	$scope.form = {
		username: '',
		email: '',
		isNews: true
	};
	$scope.isProcessing = false;

	$scope.requestSecure = () => {
		$scope.isProcessing = true;
		signUp.register($scope.form.username, $scope.form.email, $scope.form.isNews)
			.then(() => {
				$state.go('reservedUsername');
			})
			.finally(() => {
				$scope.isProcessing = false;
			});
	};
});