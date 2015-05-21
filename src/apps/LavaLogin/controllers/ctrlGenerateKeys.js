module.exports = ($scope, $state, user, signUp, crypto) => {
	if (!user.isAuthenticated())
		$state.go('login');
};