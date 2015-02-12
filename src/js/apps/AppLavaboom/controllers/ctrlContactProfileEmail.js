angular.module(primaryApplicationName).controller('CtrlContactProfileEmail', function($rootScope, $scope, $timeout, $interval, $translate, co, inbox) {
	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_EMAIL_NOT_FOUND = $translate.instant('MAIN.CONTACTS.LB_EMAIL_NOT_FOUND');
	});

	var t = null;

	$scope.isNotFound = false;
	$scope.tooltip = '';

	var loadKey = () => co(function *() {
		var key = yield inbox.getKeyForEmail($scope.currentEmail.email);
		$scope.currentEmail.key = {
			id: key.key_id,
			length: key.length,
			algos: key.algorithm,
			key: key.key
		};

		$scope.tooltip = '';
	}).catch(() => {
		$scope.tooltip = translations.LB_EMAIL_NOT_FOUND;
	});

	$scope.downloadPublicKey = () => {
		console.log('downloadPublicKey', $scope.currentEmail);
		var blob = new Blob([$scope.currentEmail.key.key], {type: "text/plain;charset=utf-8"});
		saveAs(blob, `${$scope.currentEmail.email}-publicKey.txt`);
	};

	$scope.$watch('currentEmail.email', () => {
		t = $timeout.schedule(t, () => {
			if ($scope.currentEmail && $scope.currentEmail.email)
				loadKey();
		}, 1000);
	});
});
