angular.module('AppLavaboomLogin').controller('VerifyController', function($scope, $state, user, signUp) {
	$scope.form = {
		username: signUp.reserve ? signUp.reserve.username : '',
		token: '',
		isNews: true
	};

	$scope.isProcessing = false;

	console.log(user.calculateHash('test'));

	$scope.requestVerify = () => {
		signUp.verifyInvite($scope.form)
			.then(() => {
				$state.go('plan');
			});
	};
});