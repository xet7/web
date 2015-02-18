var chan = require('chan');

module.exports = /*@ngInject*/($q, $rootScope, $state, $scope, $translate, LavaboomAPI, translate, co, crypto, loader, user) => {
	var translations = {};
	var translationsCh = chan();

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_INITIALIZING_I18N = $translate.instant('LOADER.LB_INITIALIZING_I18N');
		translations.LB_INITIALIZING_OPENPGP = $translate.instant('LOADER.LB_INITIALIZING_OPENPGP');
		translations.LB_INITIALIZATION_FAILED = $translate.instant('LOADER.LB_INITIALIZATION_FAILED');
		translations.LB_SUCCESS = $translate.instant('LOADER.LB_SUCCESS');

		if ($translate.instant('LANG.CODE') === translate.getCurrentLangCode())
			translationsCh(true);
	});

	$scope.initializeApplication = (opts) => co(function *(){
		try {
			var connectionPromise = LavaboomAPI.connect();

			if (!$rootScope.isInitialized)
				yield translationsCh;

			loader.incProgress(translations.LB_INITIALIZING_I18N, 1);

			var translateInitialization = translate.initialize();

			loader.incProgress(translations.LB_INITIALIZING_OPENPGP, 5);

			crypto.initialize();

			yield [connectionPromise, translateInitialization];

			if ($rootScope.isInitialized) {
				yield $state.go('login', {}, {reload: true});
			} else {
				$rootScope.isInitialized = true;
				
				if (opts) {
					yield user.authenticate();

					if (opts.state == 'generateKeys') {
						yield $state.go('generateKeys');
					} else if (opts.state == 'backupKeys') {
						yield $state.go('backupKeys');
					}
				}
				return {lbDone: translations.LB_SUCCESS};
			}
		} catch (error) {
			throw {message: translations.LB_INITIALIZATION_FAILED, error: error};
		}
	});
};