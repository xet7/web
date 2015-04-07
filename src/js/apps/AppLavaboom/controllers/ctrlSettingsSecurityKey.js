module.exports = /*@ngInject*/($scope, $timeout, $translate, consts, crypto, notifications) => {
	let decodeTimeout = null;
	let cryptoKey = crypto.getPrivateKeyByFingerprint($scope.key.fingerprint);

	console.log('CtrlSettingsSecurityKey instantiated with key', $scope.key, 'originates from', cryptoKey);

	const translations = {
		LB_PRIVATE_KEY_DECRYPTED: ''
	};
	$translate.bindAsObject(translations, 'MAIN.SETTINGS.SECURITY');

	$scope.$watch('key.decryptPassword', (o, n) => {
		if (o == n)
			return;
		
		if ($scope.key) {
			decodeTimeout = $timeout.schedule(decodeTimeout, () => {
				let r = false;
				if (cryptoKey && !cryptoKey.primaryKey.isDecrypted) {
					r = crypto.authenticate(cryptoKey, $scope.key.decryptPassword);

					if (r) {
						notifications.set('private-key-decrypted-ok', {
							text: translations.LB_PRIVATE_KEY_DECRYPTED,
							type: 'info',
							timeout: 3000,
							namespace: 'settings'
						});

						$scope.key.isDecrypted = true;
					}
				}

				$scope.key.decryptIsSuccess = r;
				$scope.key.decryptTime = new Date();
			}, consts.AUTO_SAVE_TIMEOUT);
		}
	});
};