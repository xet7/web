let chan = require('chan');

module.exports = /*@ngInject*/($rootScope, $timeout, $scope, $state, $translate, LavaboomAPI, co, translate, crypto, user, inbox, contacts, hotkey, loader) => {
	const translations = {
		LB_INITIALIZING_I18N : '',
		LB_INITIALIZING_OPENPGP : '',
		LB_AUTHENTICATING : '',
		LB_DECRYPTING : '',
		LB_LOADING : '',
		LB_INITIALIZATION_FAILED : '',
		LB_SUCCESS : ''
	};

	const translationPromise = $translate.bindAsObject(translations, 'LOADER');

	$scope.ddEventFilter = (name, event) => event.target.id.startsWith('taTextElement');

	$scope.initializeApplication = () => co(function *(){
		try {
			let connectionPromise = LavaboomAPI.connect();

			if (!$rootScope.isInitialized)
				yield translationPromise;

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