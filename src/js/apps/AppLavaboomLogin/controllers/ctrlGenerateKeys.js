angular.module('AppLavaboomLogin').controller('CtrlGenerateKeys', function($scope, $state, user, signUp, crypto) {
	/*if (!user.isAuthenticated())
		$state.go('invite');*/

	crypto.initialize();

	// test madness
	signUp.password = 'ztest007';
	user.signIn('let4be-2', signUp.password);
	// test madness
});
