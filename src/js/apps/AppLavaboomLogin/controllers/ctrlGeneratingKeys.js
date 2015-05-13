module.exports = /*@ngInject*/($rootScope, $scope, $state, $interval, $timeout, $translate, consts, crypto, user, co, signUp) => {
	//if (!user.isAuthenticated())
	//	$state.go('login');

	let timePassed = 0;
	$scope.progress = 0;
	$scope.label = '';
	$scope.subLabel = '';

	const translations = {
		LB_GENERATING : '',
		LB_READY : '',
		LB_REACHED : '',
		LB_ERROR : '',
		LB_UPLOADING : '',
		LB_PERFORMANCE_TEST: '',
		LB_DO_NOT_CLOSE_REF: '',
		LB_DO_NOT_CLOSE_HAMSTER: '',
		LB_DO_NOT_CLOSE_TURTLE: ''
	};

	$translate.bindAsObject(translations, 'LOGIN.GENERATING_KEYS');

	let progressBarInterval;
	progressBarInterval = $interval(() => {
		$scope.progress = Math.floor(++timePassed / consts.ESTIMATED_KEY_GENERATION_TIME_SECONDS * 95);
		if ($scope.progress >= 95) {
			$scope.label = translations.LB_REACHED;

			$interval.cancel(progressBarInterval);
			progressBarInterval = null;
		}
	}, 1000);

	function performanceTest(count, keyLength) {
		return co(function *(){
			let start = new Date().getTime();
			for(let i = 0; i < count; i++)
				yield crypto.generateKeys('test <test@test>', 'test', keyLength);
			let end = new Date().getTime();

			return end - start;
		});
	}

	co(function *() {
		try {
			$scope.label = translations.LB_PERFORMANCE_TEST;
			$scope.subLabel = translations.LB_DO_NOT_CLOSE_REF;

			//CRYPTO_PERFORMANCE_TEST_REF_TIME
			let tookMs = yield performanceTest(consts.CRYPTO_PERFORMANCE_TEST_COUNT, consts.CRYPTO_PERFORMANCE_TEST_KEY_LENGTH);
			console.log('performance test: ', tookMs);

			if (tookMs > crypto.CRYPTO_PERFORMANCE_TEST_REF_TIME * 10)
				$scope.subLabel = translations.LB_DO_NOT_CLOSE_TURTLE;
			else
			if (tookMs > crypto.CRYPTO_PERFORMANCE_TEST_REF_TIME * 5)
				$scope.subLabel = translations.LB_DO_NOT_CLOSE_HAMSTER;

			$scope.label = translations.LB_GENERATING;

			if (!user.nameEmail)
				throw new Error('wups');

			let res = yield crypto.generateKeys(user.nameEmail, signUp.password, consts.DEFAULT_KEY_LENGTH);
			console.log('login app: keys generated', res);

			crypto.importPublicKey(res.pub);
			crypto.importPrivateKey(res.prv);
			console.log('login app: keys imported');

			if (progressBarInterval) {
				$interval.cancel(progressBarInterval);
				progressBarInterval = null;
			}
			$scope.label = translations.LB_UPLOADING;

			yield user.syncKeys();
			try {
				yield user.updateKey(res.prv.primaryKey.fingerprint);
			} catch (err) {
				console.error(err);
			}

			crypto.authenticateByEmail(user.email, signUp.password);
			crypto.storeKeyring();

			$scope.progress = 100;
			$scope.label = translations.LB_READY;

			$timeout(() => {
				$state.go('backupKeys');
			}, consts.LAVABOOM_SYNC_REDIRECT_DELAY);
		} catch (err) {
			console.log('login app: keys generation error', err);

			if (progressBarInterval) {
				$interval.cancel(progressBarInterval);
				progressBarInterval = null;
			}
			$scope.label = translations.LB_ERROR;
		}
	});
};
