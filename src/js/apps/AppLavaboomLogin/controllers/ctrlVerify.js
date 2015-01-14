angular.module('AppLavaboomLogin').controller('VerifyController', function($scope, $state, signUp) {
	$scope.form = {
		username: 'wtf-test2',
		token: 'HGXHaV9bPSHSML3YGxwQ',
		isNews: true
	};

	$scope.isProcessing = false;

	$scope.verifyInvite = () => {
		signUp.tokenSignup = $scope.form;

		$state.go('plan');
	};
});
