module.exports = /*@ngInject*/($scope, $state, co, user, signUp) => {
	$scope.isUsernameDefined = signUp.reserve ? true : false;
	$scope.form = {
		username: signUp.reserve ? signUp.reserve.originalUsername : '',
		token: '',
		isNews: true
	};

	$scope.requestVerify = () => co(function *(){
		yield signUp.verifyInvite($scope.form.username, $scope.form.token, $scope.form.isNews);
		yield $state.go('plan');
	});
};