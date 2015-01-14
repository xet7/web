angular.module('AppLavaboomLogin').controller('CtrlPassword', function($scope, $state, signUp) {
	if (!signUp.tokenSignup || !signUp.details)
		$state.go('invite');

	$scope.form = {
		password: 'ztest007',
		passwordConfirm: 'ztest007'
	};

	$scope.updatePassword = () => {
		/*signUp.signUp($scope.form.password)
			.then(() => {

			});*/
		$state.go();
	};
});