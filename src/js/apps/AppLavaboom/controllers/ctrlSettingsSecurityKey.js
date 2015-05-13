module.exports = /*@ngInject*/($scope, $timeout, $translate, co, consts, crypto, notifications) => {
	console.log('CtrlSettingsSecurityKey instantiated with key', $scope.key);

	const translations = {
		LB_PRIVATE_KEY_DECRYPTED: '%'
	};
	$translate.bindAsObject(translations, 'MAIN.SETTINGS.SECURITY');

	$scope.$watch('key.decryptPassword', (o, n) => {
		if (o == n)
			return;
		
		if ($scope.key) {
			co(function *(){
				if (yield $scope.key.decrypt($scope.key.decryptPassword)) {
					notifications.set('private-key-decrypted-ok', {
						text: translations.LB_PRIVATE_KEY_DECRYPTED({email: $scope.email}),
						type: 'info',
						timeout: 3000,
						namespace: 'settings'
					});
					notifications.unSet('no-key', 'mailbox');
				}
			});
		}
	});
};