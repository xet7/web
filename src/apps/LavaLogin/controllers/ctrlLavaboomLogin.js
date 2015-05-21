module.exports = ($q, $rootScope, $state, $scope, $translate,
							   LavaboomAPI, utils, tests, notifications, translate, co, crypto, loader, user, signUp) => {
	const translations = {
		LB_INITIALIZING_I18N: '',
		LB_INITIALIZING_OPENPGP: '',
		LB_INITIALIZATION_FAILED: '',
		LB_SUCCESS: ''
	};


	$scope.initializeApplication = (opts) => co(function *(){
		try {
			let connectionPromise = LavaboomAPI.connect();

			yield translate.initialize();

			if (!$rootScope.isInitialized) {
				yield $translate.bindAsObject(translations, 'LOADER');
			}

			loader.incProgress(translations.LB_INITIALIZING_OPENPGP, 5);

			crypto.initialize();

			yield connectionPromise;

			yield tests.initialize();

			tests.performCompatibilityChecks();

			$rootScope.isInitialized = true;

			console.log('opts', opts);
			if (opts) {
				signUp.isPartiallyFlow = !!opts.state;
				if (signUp.isPartiallyFlow) {
					yield user.authenticate();

					yield $state.go(opts.state);
				}
			} else {
				yield $state.go('login', {}, {reload: true});
			}


			return {lbDone: translations.LB_SUCCESS};
		} catch (error) {
			throw {message: translations.LB_INITIALIZATION_FAILED, error: error};
		}
	});
};