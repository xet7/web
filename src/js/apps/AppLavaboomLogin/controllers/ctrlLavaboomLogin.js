module.exports = /*@ngInject*/($q, $rootScope, $state, $scope, $translate, LavaboomAPI, tests, notifications, translate, co, crypto, loader, user, signUp) => {
	const translations = {
		LB_INITIALIZING_I18N: '',
		LB_INITIALIZING_OPENPGP: '',
		LB_INITIALIZATION_FAILED: '',
		LB_SUCCESS: ''
	};

	const translationPromise = $translate.bindAsObject(translations, 'LOADER');

	$scope.notifications = [];

	$rootScope.$bind('notifications', () => {
		$scope.notifications = notifications.get();
	});

	$scope.initializeApplication = (opts) => co(function *(){
		try {
			let connectionPromise = LavaboomAPI.connect();

			if (!$rootScope.isInitialized)
				yield translationPromise;

			yield tests.initialize();

			tests.performCompatibilityChecks();

			loader.incProgress(translations.LB_INITIALIZING_I18N, 1);

			let translateInitialization = translate.initialize();

			loader.incProgress(translations.LB_INITIALIZING_OPENPGP, 5);

			crypto.initialize();

			yield [connectionPromise, translateInitialization];

			if ($rootScope.isInitialized) {
				yield $state.go('login', {}, {reload: true});
			} else {
				$rootScope.isInitialized = true;
				console.log('opts', opts);
				if (opts) {

					signUp.isPartiallyFlow = !!opts.state;
					if (signUp.isPartiallyFlow) {
						yield user.authenticate();

						yield $state.go(opts.state);
					}
				}
				return {lbDone: translations.LB_SUCCESS};
			}
		} catch (error) {
			throw {message: translations.LB_INITIALIZATION_FAILED, error: error};
		}
	});
};