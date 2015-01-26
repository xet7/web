angular.module(primaryApplicationName).controller('VerifyController', function($scope, $state, user, signUp) {
	$scope.form = {
		username: signUp.reserve ? signUp.reserve.username : '',
		token: '',
		isNews: true
	};

	$scope.isProcessing = false;

	$scope.requestVerify = () => {
		signUp.verifyInvite($scope.form.username, $scope.form.token, $scope.form.isNews)
			.then(() => {
				$state.go('plan');
			});
	};
});