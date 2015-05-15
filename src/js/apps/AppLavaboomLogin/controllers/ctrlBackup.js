module.exports = /*@ngInject*/($scope, $state, $window, co, user, signUp, crypto, cryptoKeys, loader, saver) => {
	if (!user.isAuthenticated())
		$state.go('login');

	const navigateMainApplication = () => {
		user.update({state: 'ok'});

		loader.resetProgress();
		loader.showLoader(true);
		loader.loadMainApplication();
	};

	$scope.backup = () => {
		let keysBackup = cryptoKeys.exportKeys(user.email);
		saver.saveAs(keysBackup, cryptoKeys.getExportFilename(keysBackup, user.name), 'text/plain;charset=utf-8');

		navigateMainApplication();
	};

	$scope.sync = () => co(function *(){
		let keysBackup = cryptoKeys.exportKeys(user.email);

		yield user.update({isLavaboomSynced: true, keyring: keysBackup, state: 'backupKeys'});

		let keys = crypto.clearPermanentPrivateKeysForEmail(user.email);
		crypto.initialize({isShortMemory: true});
		crypto.restorePrivateKeys(...keys);

		navigateMainApplication();
	});
};