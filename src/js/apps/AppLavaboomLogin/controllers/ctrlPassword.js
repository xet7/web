module.exports = /*@ngInject*/($scope, $state, signUp, co) => {
	if (!signUp.tokenSignup || !signUp.details)
		$state.go('login');

	$scope.form = {
		password: '',
		passwordConfirm: ''
	};

	$scope.updatePassword = () => co(function *(){
		yield signUp.setup($scope.form.password);
		yield $state.go('generateKeys');
	});
};