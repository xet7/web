module.exports = /*@ngInject*/($scope, $state, $window, user, signUp, crypto, cryptoKeys, loader) => {
	if (!user.isAuthenticated())
		$state.go('login');

	$scope.form = {
		isPrivateComputer: false
	};

	var navigateMainApplication = () => {
		user.update({state: 'ok'});

		crypto.options.isPrivateComputer = $scope.form.isPrivateComputer;
		crypto.authenticateDefault(signUp.password);

		loader.resetProgress();
		loader.showLoader(true);
		loader.loadMainApplication();
	};

	$scope.backup = () => {
		var keysBackup = cryptoKeys.exportKeys();
		var blob = new Blob([keysBackup], {type: 'text/json;charset=utf-8'});
		saveAs(blob, cryptoKeys.getExportFilename(keysBackup, user.name));

		navigateMainApplication();
	};

	$scope.skip = () => {
		navigateMainApplication();
	};
};