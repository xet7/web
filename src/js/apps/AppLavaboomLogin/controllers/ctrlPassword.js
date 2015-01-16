angular.module('AppLavaboomLogin').controller('CtrlPassword', function($scope, $state, signUp, crypto) {
	if (!signUp.tokenSignup || !signUp.details)
		$state.go('login');

	$scope.form = {
		password: 'ztest007',
		passwordConfirm: 'ztest007'
	};

	$scope.updatePassword = () => {
		signUp.setup($scope.form.password)
			.then(() => {
				$state.go('generateKeys');
			});
		//$state.go('generateKeys');
	};
});