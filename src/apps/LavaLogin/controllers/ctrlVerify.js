module.exports = ($scope, $state, $stateParams, co, user, signUp) => {
	const userName = $stateParams.userName;
	const inviteCode = $stateParams.inviteCode;

	$scope.isUsernameDefined = signUp.reserve ? true : false;
	$scope.form = {
		username: userName ? userName : (signUp.reserve ? signUp.reserve.originalUsername : ''),
		token: inviteCode ? inviteCode : '',
		isNews: true
	};

	$scope.requestVerify = () => co(function *(){
		yield signUp.verifyInvite($scope.form.username, $scope.form.token, $scope.form.isNews);
		yield $state.go('plan');
	});
};