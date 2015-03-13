module.exports = /*@ngInject*/($scope, $state, $window, user, signUp, crypto, cryptoKeys, loader, co) => {
    if (!user.isAuthenticated())
        $state.go('login');

    $scope.next = (isLavaboomSync = false) => co(function *(){
        if (isLavaboomSync) {
            let keysBackup = cryptoKeys.exportKeys(user.email);
            yield user.update({isLavaboomSynced: true, keyring: keysBackup, state: 'backupKeys'});
        } else {
            yield user.update({isLavaboomSynced: false, keyring: '', state: 'backupKeys'});
        }

        yield $state.go('backupKeys');
    });
};