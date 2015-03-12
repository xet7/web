module.exports = /*@ngInject*/($rootScope, $scope, $timeout, $interval, $translate, co, consts, inbox, saver) => {
	const translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_EMAIL_NOT_FOUND = $translate.instant('MAIN.CONTACTS.LB_EMAIL_NOT_FOUND');
	});

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
