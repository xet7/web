angular.module('AppLavaboomLogin').controller('CtrlBackup', function($scope, $state, user, cryptoKeys) {
	if (!user.isAuthenticated())
		$state.go('login');

	$scope.backup = () => {
		var keysBackup = cryptoKeys.exportKeys();
		var blob = new Blob([keysBackup], {type: "text/json;charset=utf-8"});
		saveAs(blob, cryptoKeys.getExportFilename(keysBackup));
	};
});