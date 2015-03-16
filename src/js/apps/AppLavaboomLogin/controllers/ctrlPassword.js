module.exports = /*@ngInject*/($scope, $state, signUp, co) => {
	if (!signUp.isPartiallyFlow && (!signUp.tokenSignup || !signUp.details))
		$state.go('login');

	$scope.form = {
		password: '',
		passwordConfirm: ''
	};

	$scope.updatePassword = () => co(function *(){
		if (signUp.isPartiallyFlow)
			signUp.password = $scope.form.password;
		else {
			yield signUp.setup($scope.form.password);
		}

		yield $state.go('generateKeys');
	});
};