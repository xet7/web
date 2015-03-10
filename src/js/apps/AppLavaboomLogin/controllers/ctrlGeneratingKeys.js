module.exports = /*@ngInject*/($rootScope, $scope, $state, $interval, $timeout, $translate, consts, crypto, user, co, signUp) => {
	if (!user.isAuthenticated())
		$state.go('login');

	let timePassed = 0;
	const translations = {};

	$scope.progress = 0;
	$scope.label = '';

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_GENERATING = $translate.instant('LOGIN.GENERATING_KEYS.LB_GENERATING');
		translations.LB_READY = $translate.instant('LOGIN.GENERATING_KEYS.LB_READY');
		translations.LB_REACHED = $translate.instant('LOGIN.GENERATING_KEYS.LB_REACHED');
		translations.LB_ERROR = $translate.instant('LOGIN.GENERATING_KEYS.LB_ERROR');
		translations.LB_UPLOADING = $translate.instant('LOGIN.GENERATING_KEYS.LB_UPLOADING');
		$scope.label = translations.LB_GENERATING;
	});

	let progressBarInterval = $interval(() => {
		$scope.progress = Math.floor(++timePassed / consts.ESTIMATED_KEY_GENERATION_TIME_SECONDS * 95);
		if ($scope.progress >= 95) {
			$scope.label = translations.LB_REACHED;

			$interval.cancel(progressBarInterval);
		}
	}, 1000);

	co(function *() {
		try {
			let res = yield crypto.generateKeys(user.nameEmail, signUp.password, consts.DEFAULT_KEY_LENGTH);
			console.log('login app: keys generated', res);

			$interval.cancel(progressBarInterval);
			$scope.label = translations.LB_UPLOADING;

			yield user.syncKeys();
			try {
				yield user.updateKey(res.prv.primaryKey.fingerprint);
			} catch (err) {
				console.error(err);
			}

			$scope.progress = 100;
			$scope.label = translations.LB_READY;

			$timeout(() => {
				$state.go('lavaboomSync');
			}, consts.LAVABOOM_SYNC_REDIRECT_DELAY);
		} catch (err) {
			console.log('login app: keys generation error', err);
			$scope.label = translations.LB_ERROR;
		}
	});
};
