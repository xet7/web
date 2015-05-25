module.exports = ($scope, $timeout, $translate, $state,
							   Key, dialogs, router,
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
		LB_LAVABOOM_SYNC_CANNOT_UPDATE: '',
		TITLE_CONFIRM: '',
		LB_CONFIRM_PASSWORD_CHANGE: '',
		LB_CONFIRM_KEYS_REMOVAL: '',
		LB_CANNOT_IMPORT: '',
		LB_CANNOT_IMPORT_WRONG_FORMAT: '',
		LB_CANNOT_IMPORT_CORRUPTED: '',
		LB_CANNOT_IMPORT_PUB_KEY_NOT_SUPPORTED: '',
		LB_CANNOT_IMPORT_NO_PRIVATE_KEYS_FOUND: '',
		LB_CANNOT_IMPORT_UNEXPECTED_KEY_TYPE_FOUND: '',
		LB_IMPORTED: '%'
	};
	$translate.bindAsObject(translations, 'MAIN.SETTINGS.SECURITY');

	$scope.$bind('user-settings', () => {
		$scope.settings = user.settings;
	});

	$scope.$bind('keyring-updated', () => {
		$scope.keys = crypto.getAvailablePrivateKeys()
			.map(key => {
				let k = new Key(key);
				k.email = user.styleEmail(k.email);
				return k;
			})
			.sort((a, b) => {
				if (a.keyId < b.keyId) return -1;
				if (a.keyId > b.keyId) return 1;
				return 0;
			});
		$scope.isAnyUndecryptedKeys = $scope.keys.some(k => !k.isDecrypted);

		console.log('keyring-updated', $scope.keys);
	});

	$scope.changePassword = () => co(function *(){
		try {
			const confirmed = yield co.def(dialogs.confirm(translations.TITLE_CONFIRM, translations.LB_CONFIRM_PASSWORD_CHANGE).result, 'cancelled');
			if (confirmed == 'cancelled')
				return;

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

	$scope.exportKeys = () => {
		var keysBackup = cryptoKeys.exportKeys();
		saver.saveAs(keysBackup, cryptoKeys.getExportFilename(keysBackup, user.name), 'text/plain;charset=utf-8');
	};

	$scope.generateKeys = () => {
		loader.resetProgress();
		loader.showLoader(true);
		loader.loadLoginApplication({state: 'choosePasswordIntro', noDelay: true});
	};

	$scope.removeDecryptedKeys = () => co(function *(){
		const confirmed = yield co.def(dialogs.confirm(translations.TITLE_CONFIRM, translations.LB_CONFIRM_KEYS_REMOVAL).result, 'cancelled');
		if (confirmed == 'cancelled')
			return;

		crypto.removeSensitiveKeys(true);
	});

	$scope.exportKeys = () => {
		var keysBackup = cryptoKeys.exportKeys();
		saver.saveAs(keysBackup, cryptoKeys.getExportFilename(keysBackup, user.name), 'text/plain;charset=utf-8');
	};

	$scope.exportPublicKey = (key) => {
		saver.saveAs(cryptoKeys.exportPublicKeyByFingerprint(key.fingerprint), key.email + '.asc', 'text/plain;charset=utf-8');
	};

	$scope.sendKey = (key) => {
		router.showPopup('compose', {publicKey: key.fingerprint});
	};

	$scope.importKeys = (data) => {
		try {
			let c = cryptoKeys.importKeys(data);

			if (c < 1) {
				notifications.set('import-keys', {
					text: translations.LB_CANNOT_IMPORT_NO_PRIVATE_KEYS_FOUND,
					type: 'warning',
					namespace: 'settings',
					kind: 'crypto'
				});
			} else {
				notifications.set('import-keys', {
					text: translations.LB_IMPORTED({count: c}),
					namespace: 'settings',
					kind: 'crypto'
				});
			}
		} catch (err) {
			console.log('cannot import', err.message);
			const translatedErrorMessage = translations['LB_CANNOT_IMPORT_' + err.message];

			notifications.set('import-keys', {
				text: translatedErrorMessage ? translatedErrorMessage : translations.LB_CANNOT_IMPORT,
				type: 'warning',
				namespace: 'settings',
				kind: 'crypto'
			});
		}
		inbox.invalidateEmailCache();
	};

	let updateTimeout = null;
	let isLavaboomSyncRestored = false;
	$scope.$watch('settings.isLavaboomSynced', (o, n) => {
		if (o === n || isLavaboomSyncRestored) {
			isLavaboomSyncRestored = false;
			return;
		}

		co (function *(){
			let LavaboomSyncedKeyring = '';

			if ($scope.settings.isLavaboomSynced) {
				let keysBackup = cryptoKeys.exportKeys(user.email);
				$scope.settings.keyring = keysBackup;
			}
			else
			{
				let backup = utils.def(() => cryptoKeys.verifyAndReadBackup($scope.settings.keyring), null);
				if (backup && backup.prv.length > 0) {
					const confirmed = yield co.def(dialogs.create(
						'LavaMail/misc/lsOff',
						'CtrlLsOff'
					).result, 'cancelled');

					if (confirmed == 'cancelled') {
						isLavaboomSyncRestored = true;
						$scope.settings.isLavaboomSynced = true;
						return;
					}

					LavaboomSyncedKeyring = $scope.settings.keyring;
				}
				$scope.settings.keyring = '';
			}

			if (Object.keys($scope.settings).length > 0) {
				updateTimeout = $timeout.schedulePromise(updateTimeout, () => co(function *(){
					try {
						yield user.update($scope.settings);

						let keys = crypto.clearPermanentPrivateKeysForEmail(user.email);
						console.log('clearPermanentPrivateKeysForEmail returned', keys);
						if ($scope.settings.isLavaboomSynced) {
							crypto.initialize({isShortMemory: true});
						} else {
							crypto.initialize({isShortMemory: false});
						}
						if (LavaboomSyncedKeyring) {
							cryptoKeys.importKeys(LavaboomSyncedKeyring);
							saver.saveAs(LavaboomSyncedKeyring, cryptoKeys.getExportFilename(LavaboomSyncedKeyring, user.name), 'text/plain;charset=utf-8');
						}
						crypto.restorePrivateKeys(...keys);

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
						throw err;
					}
				}), 1000);
			}
		});
	}, true);
};