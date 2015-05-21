module.exports = ($scope, $state, co, signUp) => {
	$scope.form = {
		username: '',
		email: ''
	};

	$scope.requestSecure = () => co(function *(){
		yield signUp.register($scope.form.username, $scope.form.email);

		yield $state.go('reservedUsername');
	});
};