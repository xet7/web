module.exports = ($scope, $stateParams, $translate, $timeout, co, consts, crypto, saver, notifications, router, user, Key) => {
	$scope.selectedContactId = $stateParams.contactId;
	$scope.isNotFound = false;
	$scope.emails = [];

	const translations = {
		LB_EMAIL_NOT_FOUND: '',
		LB_CANNOT_IMPORT_PUBLIC_KEY: '',
		LB_PUBLIC_KEY_IMPORTED: '%'
	};
	$translate.bindAsObject(translations, 'LAVAMAIL.CONTACTS');

	let updateTimeout = null;
	$scope.starEmail = () => {
		$scope.currentEmail.isStar = !$scope.currentEmail.isStar;

		[updateTimeout] = $timeout.schedulePromise(updateTimeout, $scope.saveThisContact, consts.AUTO_SAVE_TIMEOUT);
	};

	$scope.requestPublicKey = () => {
		router.showPopup('compose', {to: $scope.currentEmail.email, publicKey: user.key.fingerprint});
	};

	$scope.uploadPublicKey = (data) => {
		try {
			const key = crypto.readKey(data);

			if (!key)
				throw new Error('not_found');
			const primaryKey = key.primaryKey;
			if (!primaryKey)
				throw new Error('not_found');

			$scope.currentEmail.key = new Key(key);

			notifications.set('public-key-import-ok' + $scope.currentEmail.email, {
				type: 'info',
				text: translations.LB_PUBLIC_KEY_IMPORTED({
					email: $scope.currentEmail.email,
					algos: $scope.currentEmail.key.algos,
					length: $scope.currentEmail.key.length
				}),
				namespace: 'contact.profile',
				timeout: 3000,
				kind: 'crypto'
			});
		} catch (err) {
			notifications.set('public-key-import-fail' +  $scope.currentEmail.email, {
				text: translations.LB_CANNOT_IMPORT_PUBLIC_KEY,
				namespace: 'contact.profile',
				kind: 'crypto'
			});
		}
	};

	$scope.downloadPublicKey = () => {
		console.log($scope.currentEmail.key);
		saver.saveAs($scope.currentEmail.key.armor(), `${$scope.currentEmail.email}.asc`, 'text/plain;charset=utf-8');
	};

	$scope.remove = () => {
		console.log('remove from', $scope.details[$scope.emails], $scope.currentEmail.$$hashKey);
		$scope.details[$scope.emails] = $scope.details[$scope.emails].filter(e => e.$$hashKey != $scope.currentEmail.$$hashKey);
	};

	$scope.$watch('currentEmail.name', (o, n) => {
		if (o == n)
			return;

		let email = $scope.currentEmail;
		if (!email || !email.name)
			return;

		email.email = email.name.includes('@') ? email.name : `${email.name}@${consts.ROOT_DOMAIN}`;
		email.loadKey(true);
	});
};
