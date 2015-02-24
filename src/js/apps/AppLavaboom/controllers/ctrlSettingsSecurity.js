module.exports = /*@ngInject*/($scope, $timeout, utils, user, crypto, cryptoKeys, LavaboomAPI, fileReader, inbox) => {
	$scope.email = user.email;
	$scope.settings = {};

	$scope.form = {
		oldPassword: '',
		password: '',
		passwordRepeat: ''
	};

	$scope.$bind('user-settings', () => {
		$scope.settings = user.settings;
	});

	$scope.$bind('keyring-updated', () => {
		$scope.keys = crypto.getAvailableEncryptedPrivateKeys().map(k => {
			return {
				keyId: utils.hexify(k.primaryKey.keyid.bytes),
				isDecrypted: crypto.getDecryptedPrivateKeyByFingerprint(k.primaryKey.fingerprint).primaryKey.isDecrypted,
				decryptPassword: '',
				decryptIsSuccess: null,
				decryptTime: null,
				fingerprint: k.primaryKey.fingerprint,
				created: k.primaryKey.created,
				user: k.users[0].userId.userid
			};
		});

		$scope.isAnyUndecryptedKeys = $scope.keys.some(k => !k.isDecrypted);
	});

	$scope.isProcessing = false;
	$scope.passwordUpdateStatus = '';

	$scope.changePassword = () => {
		$scope.isProcessing = true;
		LavaboomAPI.accounts.update('me', {
			current_password: user.calculateHash($scope.form.oldPassword),
			new_password: user.calculateHash($scope.form.password)
		})
			.then(() => {
				$scope.passwordUpdateStatus = 'saved!';
			})
			.catch(err => {
				$scope.passwordUpdateStatus = err.message;
			})
			.finally(() => {
				$scope.isProcessing = false;
			});
	};

	$scope.exportKeys = () => {
		var keysBackup = cryptoKeys.exportKeys();
		var blob = new Blob([keysBackup], {type: 'text/json;charset=utf-8'});
		saveAs(blob, cryptoKeys.getExportFilename(keysBackup, user.name));
	};

	$scope.importKeys = (data) => {
		cryptoKeys.importKeys(data);
		inbox.invalidateEmailCache();
	};

	var updateTimeout = null;
	$scope.$watch('settings.isLavaboomSynced', (o, n) => {
		if (o === n)
			return;

		if($scope.settings.isLavaboomSynced){
			var keysBackup = cryptoKeys.exportKeys();
			$scope.settings.keyring = keysBackup;
		}else{
			$scope.settings.keyring = '';
		}

		if (Object.keys($scope.settings).length > 0) {
			updateTimeout = $timeout.schedule(updateTimeout, () => {
				user.update($scope.settings)
					.then(() => {

					})
				.catch(() => {

				});
			}, 1000);
		}
	}, true);
};