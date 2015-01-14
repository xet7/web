angular.module('AppLavaboomLogin').controller('VerifyController', function($scope, $state, signUp) {
	$scope.form = {
		username: 'let4be-signup-test',
		token: 'mIQSiiVUBvCG80fm9hAX',
		isNews: true
	};

	$scope.isProcessing = false;

	$scope.verifyInvite = () => {
		signUp.tokenSignup = $scope.form;

		$state.go('plan');
	};
});
