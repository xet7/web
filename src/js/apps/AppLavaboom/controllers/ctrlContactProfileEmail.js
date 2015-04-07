module.exports = /*@ngInject*/($scope, $stateParams, $translate, co, consts, saver) => {
	$scope.selectedContactId = $stateParams.contactId;
	$scope.isNotFound = false;
	$scope.emails = [];

	const translations = {
		LB_EMAIL_NOT_FOUND: ''
	};
	$translate.bindAsObject(translations, 'MAIN.CONTACTS');

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
