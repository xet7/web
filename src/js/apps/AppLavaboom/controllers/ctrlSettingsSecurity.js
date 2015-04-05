module.exports = /*@ngInject*/($scope, $timeout, $translate,
							   co, utils, user, crypto, cryptoKeys, LavaboomAPI, fileReader, inbox, saver) => {
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
		$scope.keys = crypto.getAvailablePrivateKeys().map(key => {
			return {
				keyId: utils.hexify(key.primaryKey.keyid.bytes),
				isDecrypted: key && key.primaryKey.isDecrypted,
				decryptPassword: '',
				decryptIsSuccess: null,
				decryptTime: null,
				fingerprint: key.primaryKey.fingerprint,
				created: key.primaryKey.created,
				user: key.users[0].userId.userid
			};
		});
		console.log('keyring-updated', $scope.keys);

		$scope.isAnyUndecryptedKeys = $scope.keys.some(k => !k.isDecrypted);
	});

	$scope.passwordUpdateStatus = '';

	$scope.changePassword = () => co(function *(){
		try {
			yield user.updatePassword($scope.form.oldPassword, $scope.form.password);
			crypto.changePassword(user.email, $scope.form.oldPassword, $scope.form.password);

			$scope.passwordUpdateStatus = 'saved!';
		} catch (err) {
			$scope.passwordUpdateStatus = err.message;
		}
	});

	$scope.generateKeys = () => {
		loader.resetProgress();
		loader.showLoader(true);
		loader.loadLoginApplication({state: 'choosePasswordIntro', noDelay: true});
	};

	$scope.removeDecryptedKeys = () => {
		crypto.removeSensitiveKeys(true);
	};

	$scope.downloadKey = (keyMeta) => {
		const key = crypto.getPublicKeyByFingerprint(keyMeta.fingerprint);
		saver.saveAs(key.armor(), user.name + '.pgp');
	};

	$scope.exportKeys = () => {
		let keysBackup = cryptoKeys.exportKeys();
		saver.saveAs(keysBackup, cryptoKeys.getExportFilename(keysBackup, user.name));
	};

	$scope.importKeys = (data) => {
		cryptoKeys.importKeys(data);
		inbox.invalidateEmailCache();
	};

	let updateTimeout = null;
	$scope.$watch('settings.isLavaboomSynced', (o, n) => {
		if (o === n)
			return;

		if($scope.settings.isLavaboomSynced){
			let keysBackup = cryptoKeys.exportKeys(user.email);
			$scope.settings.keyring = keysBackup;
		}else{
			$scope.settings.keyring = '';
		}

		if (Object.keys($scope.settings).length > 0) {
			updateTimeout = $timeout.schedulePromise(updateTimeout, () => co(function *(){
				// todo: handle errors
				try {
					yield user.update($scope.settings);
				} catch (err) {

				}
			}), 1000);
		}
	}, true);
};