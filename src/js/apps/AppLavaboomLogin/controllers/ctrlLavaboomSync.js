module.exports = /*@ngInject*/($scope, $state, $window, user, signUp, crypto, cryptoKeys, loader, co) => {
    if (!user.isAuthenticated())
        $state.go('login');

    $scope.next = (isLavaboomSync = false) => co(function *(){
		let keysBackup = cryptoKeys.exportKeys(user.email);

		let keys;
        if (isLavaboomSync) {
            yield user.update({isLavaboomSynced: true, keyring: keysBackup, state: 'backupKeys'});

			keys = crypto.clearPermanentPrivateKeysForEmail(user.email);
			crypto.initialize({isShortMemory: true});
        } else {
            yield user.update({isLavaboomSynced: false, keyring: '', state: 'backupKeys'});

			keys = crypto.clearPermanentPrivateKeysForEmail(user.email);
			crypto.initialize({isShortMemory: false});
        }

		crypto.restorePrivateKeys(...keys);

        yield $state.go('backupKeys');
    });
};