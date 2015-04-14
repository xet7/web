module.exports = /*@ngInject*/($scope, $timeout, $translate, Key,
							   co, utils, user, crypto, cryptoKeys, LavaboomAPI, fileReader, inbox, saver, notifications) => {
	$scope.email = user.email;
	$scope.settings = {};

	$scope.form = {
		oldPassword: '',
		password: '',
		passwordRepeat: ''
	};

	const translations = {
		LB_PASSWORD_CANNOT_BE_CHANGED: '%',
		LB_PASSWORD_CHANGED: '',
		LB_LAVABOOM_SYNC_ACTIVATED: '',
		LB_LAVABOOM_SYNC_DEACTIVATED: '',
		LB_LAVABOOM_SYNC_CANNOT_UPDATE: ''
	};
	$translate.bindAsObject(translations, 'MAIN.SETTINGS.SECURITY');

	$scope.$bind('user-settings', () => {
		$scope.settings = user.settings;
	});

	$scope.$bind('keyring-updated', () => {
		$scope.keys = crypto.getAvailablePrivateKeys()
			.map(key => new Key(key))
			.sort((a, b) => {
				if (a.user < b.user) return -1;
				if (a.user > b.user) return 1;
				return 0;
			});
		$scope.isAnyUndecryptedKeys = $scope.keys.some(k => !k.isDecrypted);

		console.log('keyring-updated', $scope.keys);
	});

	$scope.changePassword = () => co(function *(){
		try {
			yield user.updatePassword($scope.form.oldPassword, $scope.form.password);
			crypto.changePassword(user.email, $scope.form.oldPassword, $scope.form.password);

			notifications.set('password-changed-ok', {
				text: translations.LB_PASSWORD_CHANGED,
				type: 'info',
				timeout: 3000,
				namespace: 'settings'
			});
		} catch (err) {
			notifications.set('password-changed-fail', {
				text: translations.LB_PASSWORD_CANNOT_BE_CHANGED({error: err.message}),
				namespace: 'settings'
			});
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
				try {
					yield user.update($scope.settings);

					notifications.set('ls-ok', {
						text: $scope.settings.isLavaboomSynced ? translations.LB_LAVABOOM_SYNC_ACTIVATED : translations.LB_LAVABOOM_SYNC_DEACTIVATED,
						type: 'info',
						timeout: 3000,
						namespace: 'settings'
					});
				} catch (err) {
					notifications.set('ls-fail', {
						text: translations.LB_LAVABOOM_SYNC_CANNOT_UPDATE,
						namespace: 'settings'
					});
				}
			}), 1000);
		}
	}, true);
};