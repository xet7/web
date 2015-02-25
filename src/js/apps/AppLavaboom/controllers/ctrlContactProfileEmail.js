module.exports = /*@ngInject*/($rootScope, $scope, $timeout, $interval, $translate, co, consts, inbox, saver) => {
	let translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_EMAIL_NOT_FOUND = $translate.instant('MAIN.CONTACTS.LB_EMAIL_NOT_FOUND');
	});

	let t = null;

	$scope.isNotFound = false;
	$scope.tooltip = '';

	let loadKey = () => co(function *() {
		let key = yield inbox.getKeyForEmail($scope.currentEmail.email);

		$scope.currentEmail.key = {
			id: key.key_id,
			length: key.length,
			algos: key.algorithm,
			key: key.key
		};

		$scope.tooltip = '';
	}).catch(() => {
		$scope.tooltip = translations.LB_EMAIL_NOT_FOUND;
		$scope.currentEmail.key = null;
	});

	$scope.downloadPublicKey = () => {
		saver.saveAs($scope.currentEmail.key.key, `${$scope.currentEmail.email}-publicKey.txt`);
	};

	$scope.$watch('currentEmail.name', () => {
		if (!$scope.currentEmail || !$scope.currentEmail.name)
			return;

		let name = $scope.currentEmail.name;
		let domain;

		if (name.includes('@')) {
			$scope.currentEmail.email = name;
			domain = $scope.currentEmail.email.split('@')[1];
			if (!domain)
				return;
			domain = domain.trim();
		} else {
			$scope.currentEmail.email = `${name}@${consts.ROOT_DOMAIN}`;
			domain = consts.ROOT_DOMAIN;
		}

		console.log($scope.currentEmail.email, domain);

		if (domain == consts.ROOT_DOMAIN) {
			t = $timeout.schedule(t, () => {
				loadKey();
			}, 1000);
		} else {
			$scope.tooltip = '';
			$scope.currentEmail.key = null;
		}
	});
};
