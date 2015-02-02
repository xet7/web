angular.module(primaryApplicationName).controller('CtrlSettingsSecurityKey', function($scope, $timeout, consts, crypto) {
	var decodeTimeout = null;

	console.log('CtrlSettingsSecurityKey instantiated with key', $scope.key);

	$scope.$watch('key.decryptPassword', function () {
		console.log('key', $scope.key);

		if ($scope.key) {
			decodeTimeout = $timeout.schedule(decodeTimeout, () => {
				var key = crypto.keyring.privateKeys.findByFingerprint($scope.key.fingerprint);
				console.log('key found', key);

				var r = false;
				if (key) {
					r = crypto.authenticate(key, $scope.key.decryptPassword);
					console.log('decrypt result', r);
					if (r)
						$scope.key.isDecrypted = true;
				}

				$scope.key.decryptIsSuccess = r;
				$scope.key.decryptTime = new Date();
			}, consts.AUTOSAVE_TIMEOUT);
		}
	});
});