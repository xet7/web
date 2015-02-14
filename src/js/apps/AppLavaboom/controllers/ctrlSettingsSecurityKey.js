module.exports = ($scope, $timeout, consts, crypto) => {
	var decodeTimeout = null;
	var cryptoKey = crypto.getPrivateKeyByFingerprint($scope.key.fingerprint);

	console.log('CtrlSettingsSecurityKey instantiated with key', $scope.key);

	$scope.$watch('key.decryptPassword', function () {
		console.log('key', $scope.key);

		if ($scope.key) {
			decodeTimeout = $timeout.schedule(decodeTimeout, () => {
				var r = false;
				if (cryptoKey) {
					r = crypto.authenticate(cryptoKey, $scope.key.decryptPassword);

					if (r)
						$scope.key.isDecrypted = true;
				}

				$scope.key.decryptIsSuccess = r;
				$scope.key.decryptTime = new Date();
			}, consts.AUTO_SAVE_TIMEOUT);
		}
	});
};