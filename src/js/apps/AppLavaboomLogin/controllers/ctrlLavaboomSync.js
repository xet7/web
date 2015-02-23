module.exports = /*@ngInject*/($scope, $state, $window, user, signUp, crypto, cryptoKeys, loader) => {
    if (!user.isAuthenticated())
        $state.go('login');

    $scope.form = {
        enable_sync: false
    };

    $scope.goNext = () => {
        if($scope.form.enable_sync) {
            var keysBackup = cryptoKeys.exportKeys();
            user.update({isLavaboomSynced: true, keyring: keysBackup});
        }else{
            user.update({isLavaboomSynced: false, keyring: ''});
        }

        $state.go('backupKeys');
    };
};