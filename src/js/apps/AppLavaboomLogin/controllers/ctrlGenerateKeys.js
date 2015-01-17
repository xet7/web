angular.module(primaryApplicationName).controller('CtrlGenerateKeys', function($scope, $state, user, signUp, crypto) {
	if (!user.isAuthenticated())
		$state.go('login');
});