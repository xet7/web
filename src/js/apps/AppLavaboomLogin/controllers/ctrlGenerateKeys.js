module.exports = /*@ngInject*/($scope, $state, user, signUp, crypto) => {
	if (!user.isAuthenticated())
		$state.go('login');
};