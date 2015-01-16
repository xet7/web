angular.module('AppLavaboomLogin').controller('VerifyController', function($scope, $state, signUp) {
	$scope.form = {
		username: signUp.reserve ? signUp.reserve.username : '',
		token: '',
		isNews: true
	};

	$scope.isProcessing = false;

	$scope.requestVerify = () => {
		signUp.verifyInvite($scope.form)
			.then(() => {
				$state.go('plan');
			});
	};
});