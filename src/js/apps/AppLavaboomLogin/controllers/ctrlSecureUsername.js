module.exports = ($scope, $state, co, signUp) => {
	$scope.form = {
		username: '',
		email: '',
		isNews: true
	};

	$scope.requestSecure = () => co(function *(){
		yield signUp.register($scope.form.username, $scope.form.email, $scope.form.isNews);

		yield $state.go('reservedUsername');
	});
};