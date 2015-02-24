module.exports = /*@ngInject*/($scope, $state, $window, user, signUp, crypto, cryptoKeys, loader, co) => {
    if (!user.isAuthenticated())
        $state.go('login');

    $scope.form = {
        isLavaboomSynced: false
    };

    $scope.doLavaboomSync = () => co(function *(){
        if($scope.form.isLavaboomSynced) {
            var keysBackup = cryptoKeys.exportKeys(user.email);
            yield user.update({isLavaboomSynced: true, keyring: keysBackup});
        }else{
            yield user.update({isLavaboomSynced: false, keyring: ''});
        }

        yield $state.go('backupKeys');
    });
};