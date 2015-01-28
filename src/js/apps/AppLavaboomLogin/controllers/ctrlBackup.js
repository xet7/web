angular.module(primaryApplicationName).controller('CtrlBackup', function($scope, $state, $window, user, signUp, crypto, cryptoKeys, loader) {
	if (!user.isAuthenticated())
		$state.go('login');

	var navigateMainApplication = () => {
		crypto.options.isPrivateComputer = false;
		crypto.authenticateDefault(signUp.password);

		loader.resetProgress();
		loader.showLoader(true);
		loader.loadMainApplication();
	};

	$scope.backup = () => {
		var keysBackup = cryptoKeys.exportKeys();
		var blob = new Blob([keysBackup], {type: "text/json;charset=utf-8"});
		saveAs(blob, cryptoKeys.getExportFilename(keysBackup));

		navigateMainApplication();
	};

	$scope.skip = () => {
		navigateMainApplication();
	};
});