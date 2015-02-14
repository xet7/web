var Buffer = require('buffer/').Buffer;

angular.module(primaryApplicationName).controller('CtrlSettingsSecurity',
	function($scope, $timeout, utils, user, crypto, cryptoKeys, apiProxy, fileReader, inbox) {
		$scope.email = user.email;

		$scope.form = {
			oldPassword: '',
			password: '',
			passwordRepeat: ''
		};

		$scope.$bind('keyring-updated', () => {
			$scope.keys = crypto.keyring.privateKeys.keys.map(k => {
				return {
					keyId: utils.hexify(k.primaryKey.keyid.bytes),
					isDecrypted: crypto.getPrivateKeyByFingerprint(k.primaryKey.fingerprint).primaryKey.isDecrypted,
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
			apiProxy(['accounts', 'update'], 'me', {
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

		$scope.getFile = function(file) {
			fileReader.readAsText(file, $scope)
				.then(jsonBackup => {
					cryptoKeys.importKeys(jsonBackup);
					inbox.invalidateEmailCache();
				})
				.catch(error => {
					console.error(error);
				});
		};

		$scope.exportKeys = () => {
			var keysBackup = cryptoKeys.exportKeys();
			var blob = new Blob([keysBackup], {type: 'text/json;charset=utf-8'});
			saveAs(blob, cryptoKeys.getExportFilename(keysBackup, user.name));
		};

		$scope.importKeys = () => {
			document.getElementById('import-btn').click();
		};
	});