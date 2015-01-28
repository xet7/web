angular.module(primaryApplicationName).controller('CtrlGeneratingKeys', function($rootScope, $scope, $state, $interval, $timeout, $translate, consts, crypto, user, co, signUp) {
	if (!user.isAuthenticated())
		$state.go('login');

	const bits = consts.DEFAULT_KEY_LENGTH;
	const estimatedTimeSeconds = consts.ESTIMATED_KEY_GENERATION_TIME_SECONDS;
	var timePassed = 0;

	$scope.progress = 0;

	var translations = {};
	$scope.label = '';

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LABEL_GENERATING = $translate.instant('LOGIN.GENERATING_KEYS.LABEL_GENERATING');
		translations.LABEL_GENERATED = $translate.instant('LOGIN.GENERATING_KEYS.LABEL_GENERATED');
		translations.LABEL_REACHED = $translate.instant('LOGIN.GENERATING_KEYS.LABEL_REACHED');
		translations.LABEL_ERROR = $translate.instant('LOGIN.GENERATING_KEYS.LABEL_ERROR');
		$scope.label = translations.LABEL_GENERATING;
	});

	var progressBarInterval = $interval(() => {
		$scope.progress = Math.floor(++timePassed / estimatedTimeSeconds * 100);
		if ($scope.progress >= 100) {
			$scope.label = translations.LABEL_REACHED;
			$interval.clear(progressBarInterval);
		}
	}, 1000);

	crypto.generateKeys(user.nameEmail, signUp.password, bits)
		.then((res) => {
			console.log('keys generated!', res);
			$scope.progress = 100;
			$scope.label = translations.LABEL_GENERATED;
			$interval.cancel(progressBarInterval);

			$timeout(() => {
				$state.go('backupKeys');
			}, consts.BACKUP_KEYS_REDIRECT_DELAY);
		})
		.catch(err => {
			console.log('keys generation error!', err);
			$scope.label = translations.LABEL_ERROR;
		});
});
