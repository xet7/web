angular.module(primaryApplicationName).controller('CtrlGeneratingKeys', function($rootScope, $scope, $state, $interval, $timeout, $translate, consts, crypto, user, co, signUp) {
	if (!user.isAuthenticated())
		$state.go('login');

	var timePassed = 0;
	var translations = {};
	
	$scope.progress = 0;
	$scope.label = '';

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_GENERATING = $translate.instant('LOGIN.GENERATING_KEYS.LB_GENERATING');
		translations.LB_GENERATED = $translate.instant('LOGIN.GENERATING_KEYS.LB_GENERATED');
		translations.LB_REACHED = $translate.instant('LOGIN.GENERATING_KEYS.LB_REACHED');
		translations.LB_ERROR = $translate.instant('LOGIN.GENERATING_KEYS.LB_ERROR');
		$scope.label = translations.LB_GENERATING;
	});

	var progressBarInterval = $interval(() => {
		$scope.progress = Math.floor(++timePassed / consts.ESTIMATED_KEY_GENERATION_TIME_SECONDS * 100);
		if ($scope.progress >= 100) {
			$scope.label = translations.LB_REACHED;
			$interval.clear(progressBarInterval);
		}
	}, 1000);

	crypto.generateKeys(user.nameEmail, signUp.password, consts.DEFAULT_KEY_LENGTH)
		.then((res) => {
			console.log('keys generated!', res);
			$scope.progress = 100;
			$scope.label = translations.LB_GENERATED;
			$interval.cancel(progressBarInterval);

			$timeout(() => {
				$state.go('backupKeys');
			}, consts.BACKUP_KEYS_REDIRECT_DELAY);
		})
		.catch(err => {
			console.log('keys generation error!', err);
			$scope.label = translations.LB_ERROR;
		});
});
