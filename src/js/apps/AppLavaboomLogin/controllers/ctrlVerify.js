angular.module('AppLavaboomLogin').controller('VerifyController', function($scope, $state, user) {
	$scope.form = {
		username: '',
		token: '',
		isNews: false
	};

	$scope.isProcessing = false;

	$scope.verifyInvite = () => {
		$state.go('plan');
	};
});
