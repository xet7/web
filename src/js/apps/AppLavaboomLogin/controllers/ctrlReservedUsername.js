module.exports = /*@ngInject*/($scope, $state, signUp) => {
	if (!signUp.reserve)
		$state.go('login');
	$scope.email = signUp.reserve.altEmail;
};