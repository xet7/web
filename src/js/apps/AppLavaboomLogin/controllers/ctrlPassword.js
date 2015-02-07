angular.module(primaryApplicationName).controller('CtrlPassword', function($scope, $state, signUp, crypto) {
	if (!signUp.tokenSignup || !signUp.details)
		$state.go('login');

	$scope.form = {
		password: '',
		passwordConfirm: ''
	};

	$scope.isProcessing = false;

	$scope.updatePassword = () => {
		$scope.isProcessing = true;
		signUp.setup($scope.form.password)
			.then(() => {
				$state.go('generateKeys');
			})
			.finally(() => {
				$scope.isProcessing = false;
			});
	};
});