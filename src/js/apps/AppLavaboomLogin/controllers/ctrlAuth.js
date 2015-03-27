module.exports = /*@ngInject*/($scope, $rootScope, $window, $interval, co, user, loader) => {
	let signInSettings = null;
	try {
		signInSettings = JSON.parse(localStorage.signInSettings);
	} catch(err) {
		console.error('Cannot read sign in settings', err);
		signInSettings = null;
	}

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