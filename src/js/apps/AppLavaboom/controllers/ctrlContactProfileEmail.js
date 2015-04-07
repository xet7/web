module.exports = /*@ngInject*/($scope, $stateParams, $translate, co, consts, crypto, saver, notifications) => {
	$scope.selectedContactId = $stateParams.contactId;
	$scope.isNotFound = false;
	$scope.emails = [];

	const translations = {
		LB_EMAIL_NOT_FOUND: '',
		LB_CANNOT_IMPORT_PUBLIC_KEY: '',
		LB_PUBLIC_KEY_IMPORTED: '%'
	};
	$translate.bindAsObject(translations, 'MAIN.CONTACTS');

	$scope.uploadPublicKey = (data) => {
		try {
			const key = crypto.readKey(data);

			if (!key)
				throw new Error('not_found');
			const primaryKey = key.primaryKey;
			if (!primaryKey)
				throw new Error('not_found');

			$scope.currentEmail.key = {
				key: data,
				algos: primaryKey.algorithm.split('_')[0].toUpperCase(),
				id: primaryKey.keyid.toHex(),
				length: primaryKey.getBitSize()
			};
			$scope.currentEmail.unfold('');

			notifications.set('public-key-import-ok' + $scope.currentEmail.email, {
				type: 'info',
				text: translations.LB_PUBLIC_KEY_IMPORTED({
					email: $scope.currentEmail.email,
					algos: $scope.currentEmail.key.algos,
					length: $scope.currentEmail.key.length
				}),
				namespace: 'contact.profile',
				timeout: 3000
			});
		} catch (err) {
			notifications.set('public-key-import-fail' +  $scope.currentEmail.email, {
				text: translations.LB_CANNOT_IMPORT_PUBLIC_KEY,
				namespace: 'contact.profile'
			});
		}
	};

	$scope.downloadPublicKey = () => {
		saver.saveAs($scope.currentEmail.key.key, `${$scope.currentEmail.email}-publicKey.txt`);
	};

	$scope.remove = () => {
		console.log('remove from', $scope.details[$scope.emails], $scope.currentEmail.$$hashKey);
		$scope.details[$scope.emails] = $scope.details[$scope.emails].filter(e => e.$$hashKey != $scope.currentEmail.$$hashKey);
	};

	$scope.$watch('currentEmail.name', () => {
		let email = $scope.currentEmail;
		if (!email || !email.name)
			return;

		email.email = email.name.includes('@') ? email.name : `${email.name}@${consts.ROOT_DOMAIN}`;
		email.loadKey(true);
	});
};
