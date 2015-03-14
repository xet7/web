module.exports = /*@ngInject*/($rootScope, $scope, $timeout, $interval, $translate, co, consts, inbox, saver) => {
	const translations = {
		LB_EMAIL_NOT_FOUND: ''
	};
	$translate.bindAsObject(translations, 'MAIN.CONTACTS');

	$scope.isNotFound = false;

	$scope.downloadPublicKey = () => {
		saver.saveAs($scope.currentEmail.key.key, `${$scope.currentEmail.email}-publicKey.txt`);
	};

	$scope.$watch('currentEmail.name', () => {
		let email = $scope.currentEmail;
		if (!email || !email.name)
			return;

		email.email = email.name.includes('@') ? email.name : `${email.name}@${consts.ROOT_DOMAIN}`;
		email.loadKey(true);
	});
};
