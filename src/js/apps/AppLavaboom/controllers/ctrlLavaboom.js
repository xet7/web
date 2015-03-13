let chan = require('chan');

module.exports = /*@ngInject*/($rootScope, $timeout, $scope, $state, $translate, LavaboomAPI, co, translate, crypto, user, inbox, contacts, hotkey, loader) => {
	const translations = {};
	const translationsCh = chan();

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

	$scope.ddEventFilter = (name, event) => event.target.id.startsWith('taTextElement');

	$scope.initializeApplication = () => co(function *(){
		try {
			let connectionPromise = LavaboomAPI.connect();

			if (!$rootScope.isInitialized)
				yield translationsCh;

			loader.incProgress(translations.LB_INITIALIZING_I18N, 1);

			let translateInitialization = translate.initialize();

			loader.incProgress(translations.LB_INITIALIZING_OPENPGP, 1);

			crypto.initialize();

			yield [connectionPromise, translateInitialization];

			loader.incProgress(translations.LB_AUTHENTICATING, 5);
			yield user.gatherUserInformation();

			loader.incProgress(translations.LB_LOADING, 5);
			yield [inbox.initialize(), contacts.initialize()];

			if ($state.current.name == 'empty')
				yield $state.go('main.inbox.label', {labelName: 'Inbox', threadId: null}, {reload: true});

			$rootScope.isInitialized = true;

			hotkey.initialize(user.settings.isHotkeyEnabled);
			return {lbDone: translations.LB_SUCCESS};
		} catch (error) {
			throw {message: translations.LB_INITIALIZATION_FAILED, error: error};
		}
	});

	$scope.onApplicationReady = () => {
		$rootScope.$broadcast('initialization-completed');
	};
};