module.exports = ($scope, $state, signUp, co, crypto, user) => {
	if (!signUp.isPartiallyFlow && (!signUp.tokenSignup || !signUp.details))
		$state.go('login');

	$scope.isPartiallyFlow = signUp.isPartiallyFlow;

	$scope.form = {
		password: '',
		passwordConfirm: '',
		isPrivateComputer: false
	};

	$scope.updatePassword = () => co(function *(){
		if (signUp.isPartiallyFlow)
			signUp.password = $scope.form.password;
		else {
			yield signUp.setup($scope.form.password, $scope.form.isPrivateComputer);
		}

		yield $state.go('generateKeys');
	});
};