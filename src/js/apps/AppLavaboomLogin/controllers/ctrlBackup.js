angular.module('AppLavaboomLogin').controller('CtrlBackup', function($scope, $state, $base64, user, cryptoKeys) {
	if (!user.isAuthenticated())
		$state.go('login');

	$scope.backup = () => {
		var keysBackup = cryptoKeys.exportKeys();

		var hashPostfix = $base64.encode(openpgp.crypto.hash.md5(keysBackup)).substr(0, 8);
		var blob = new Blob([keysBackup], {type: "text/json;charset=utf-8"});
		saveAs(blob, `${user.name}-${hashPostfix}.json`);
	};
});