angular.module(primaryApplicationName).controller('VerifyController', function($scope, $state, co, user, signUp) {
	$scope.form = {
		username: signUp.reserve ? signUp.reserve.username : '',
		token: '',
		isNews: true
	};

	$scope.requestVerify = () => co(function *(){
		yield signUp.verifyInvite($scope.form.username, $scope.form.token, $scope.form.isNews);
		yield $state.go('plan');
	});
});