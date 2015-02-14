angular.module(primaryApplicationName).controller('CtrlSelectPlan',
	function($scope, $state, signUp) {
		if (!signUp.tokenSignup)
			$state.go('invite');

		$scope.selectPlan = () => {
			signUp.plan = 'beta';
			$state.go('details');
		};
	});