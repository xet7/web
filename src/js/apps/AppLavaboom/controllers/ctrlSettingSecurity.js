var Buffer = require('buffer/').Buffer;

angular.module(primaryApplicationName).controller('CtrlSettingsSecurity', function($scope, utils, user, crypto) {
	$scope.email = user.email;

	$scope.form = {
		oldPassword: '********',
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

	console.log('$scope.keys', $scope.keys);
});