module.exports = /*@ngInject*/($scope, $state, $window, user, signUp, crypto, cryptoKeys, loader) => {
	if (!user.isAuthenticated())
		$state.go('login');

	$scope.form = {
		isPrivateComputer: false,
		isLavaboomSynced: false
	};

	var navigateMainApplication = () => {
		user.update({state: 'ok'});

		crypto.options.isPrivateComputer = $scope.form.isPrivateComputer;
		crypto.authenticateDefault(signUp.password);

		loader.resetProgress();
		loader.showLoader(true);
		loader.loadMainApplication();
	};

	var doLavaboomSync = () => {
		if($scope.form.isLavaboomSynced) {
			var keysBackup = cryptoKeys.exportKeys();
			user.update({isLavaboomSynced: true, keyring: keysBackup});
		}else{
			user.update({isLavaboomSynced: false, keyring: ''});
		}
	};

	$scope.backup = () => {
		var keysBackup = cryptoKeys.exportKeys();
		var blob = new Blob([keysBackup], {type: 'text/json;charset=utf-8'});
		saveAs(blob, cryptoKeys.getExportFilename(keysBackup, user.name));

		doLavaboomSync();

		navigateMainApplication();
	};

	$scope.skip = () => {
		doLavaboomSync();

		navigateMainApplication();
	};
};