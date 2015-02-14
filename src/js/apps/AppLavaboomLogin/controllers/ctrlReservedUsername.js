angular.module(primaryApplicationName).controller('CtrlReservedUsername',
	function($scope, $state, signUp) {
		if (!signUp.reserve)
			$state.go('login');
		$scope.email = signUp.reserve.altEmail;
	});