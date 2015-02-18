var chan = require('chan');

module.exports = /*@ngInject*/($rootScope, $timeout, $scope, $state, $translate, LavaboomAPI, co, translate, crypto, user, inbox, contacts, loader) => {
	var translations = {};
	var translationsCh = chan();

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_INITIALIZING_I18N = $translate.instant('LOADER.LB_INITIALIZING_I18N');
		translations.LB_INITIALIZING_OPENPGP = $translate.instant('LOADER.LB_INITIALIZING_OPENPGP');
		translations.LB_AUTHENTICATING = $translate.instant('LOADER.LB_AUTHENTICATING');
		translations.LB_DECRYPTING = $translate.instant('LOADER.LB_DECRYPTING');
		translations.LB_LOADING = $translate.instant('LOADER.LB_LOADING');
		translations.LB_INITIALIZATION_FAILED = $translate.instant('LOADER.LB_INITIALIZATION_FAILED');
		translations.LB_SUCCESS = $translate.instant('LOADER.LB_SUCCESS');

		if ($translate.instant('LANG.CODE') === translate.getCurrentLangCode())
			translationsCh(true);
	});

	$scope.initializeApplication = () => co(function *(){
		try {
			var connectionPromise = LavaboomAPI.connect();

			if (!$rootScope.isInitialized)
				yield translationsCh;

			loader.incProgress(translations.LB_INITIALIZING_I18N, 1);

			var translateInitialization = translate.initialize();

			loader.incProgress(translations.LB_INITIALIZING_OPENPGP, 1);

			crypto.initialize();

			yield [connectionPromise, translateInitialization];
			loader.incProgress(translations.LB_LOADING, 5);

			yield [user.gatherUserInformation(), inbox.initialize(), contacts.initialize()];

			if ($state.current.name == 'empty')
				yield $state.go('main.inbox.label', {labelName: 'Inbox', threadId: null}, {reload: true});

			$rootScope.isInitialized = true;
			return {lbDone: translations.LB_SUCCESS};
		} catch (error) {
			throw {message: translations.LB_INITIALIZATION_FAILED, error: error};
		}
	});

	$scope.onApplicationReady = () => {
		$rootScope.$broadcast('initialization-completed');
	};
};