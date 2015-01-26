var Buffer = require('buffer/').Buffer;

angular.module(primaryApplicationName).controller('CtrlSettingsSecurity', function($scope, $timeout, utils, user, crypto, apiProxy) {
	$scope.email = user.email;

	$scope.form = {
		oldPassword: '',
		password: '',
		passwordRepeat: ''
	};

	$scope.keys = crypto.keyring.privateKeys.keys.map(k => {
		return {
			keyId: utils.hexify(k.primaryKey.keyid.bytes),
			fingerprint: k.primaryKey.fingerprint,
			created: k.primaryKey.created,
			user: k.users[0].userId.userid
		};
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
});