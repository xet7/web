module.exports = /*@ngInject*/($scope, $rootScope, $window, $interval, co, user, loader, utils) => {
	let signInSettings = utils.def(() => JSON.parse(localStorage.signInSettings), null);

	$scope.form = {
		username: '',
		password: '',
		isPrivateComputer: signInSettings ? signInSettings.isPrivateComputer : false
	};

	$scope.$watch('form', (o, n) => {
		localStorage.signInSettings = JSON.stringify({
			isPrivateComputer: $scope.form.isPrivateComputer
		});
	}, true);

	$scope.logIn = () => co(function *(){
		yield user.signIn($scope.form.username, $scope.form.password, $scope.form.isPrivateComputer, $scope.form.isPrivateComputer);

		loader.resetProgress();
		loader.showLoader(true);
		loader.loadMainApplication();
	});
};