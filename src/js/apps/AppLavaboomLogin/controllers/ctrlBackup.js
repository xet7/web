module.exports = /*@ngInject*/($scope, $state, $window, user, signUp, crypto, cryptoKeys, loader, saver) => {
	if (!user.isAuthenticated())
		$state.go('login');

	$scope.form = {
		isPrivateComputer: false
	};

	var navigateMainApplication = () => {
		user.update({state: 'ok'});

		crypto.options.isPrivateComputer = $scope.form.isPrivateComputer;
		crypto.authenticateByEmail(user.email, signUp.password);

		loader.resetProgress();
		loader.showLoader(true);
		loader.loadMainApplication();
	};

	$scope.backup = () => {
		let keysBackup = cryptoKeys.exportKeys(user.email);
		saver.saveAs(keysBackup, cryptoKeys.getExportFilename(keysBackup, user.name));

		navigateMainApplication();
	};

	$scope.skip = () => {
		navigateMainApplication();
	};
};