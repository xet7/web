angular.module(primaryApplicationNameprimaryApplicationName).controller('CtrlGenerateKeys', function($scope, $state, user, signUp, crypto) {
	if (!user.isAuthenticated())
		$state.go('login');
});