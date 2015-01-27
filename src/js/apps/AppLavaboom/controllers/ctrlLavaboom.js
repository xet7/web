var chan = require('chan');

angular.module(primaryApplicationName).controller('CtrlLavaboom', function($q, $rootScope, $timeout, $scope, $state, $translate, co, translate, crypto, cryptoKeys, user, inbox, contacts, loader) {
	var translations = {};
	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_INITIALIZING_I18N = $translate.instant('LOADER.LB_INITIALIZING_I18N');
		translations.LB_INITIALIZING_OPENPGP = $translate.instant('LOADER.LB_INITIALIZING_OPENPGP');
		translations.LB_AUTHENTICATING = $translate.instant('LOADER.LB_AUTHENTICATING');
		translations.LB_DECRYPTING = $translate.instant('LOADER.LB_DECRYPTING');
		translations.LB_LOADING_EMAILS = $translate.instant('LOADER.LB_LOADING_EMAILS');
		translations.LB_LOADING_CONTACTS = $translate.instant('LOADER.LB_LOADING_CONTACTS');
		translations.LB_INITIALIZATION_FAILED = $translate.instant('LOADER.LB_INITIALIZATION_FAILED');
		translations.LB_SUCCESS = $translate.instant('LOADER.LB_SUCCESS');
	});

	$scope.isInitialized = false;

	$scope.initializeApplication = () => co(function *(){
		try {
			loader.incProgress(translations.LB_INITIALIZING_I18N, 1);

			translate.initialize();

			loader.incProgress(translations.LB_INITIALIZING_OPENPGP, 1);

			crypto.initialize();

			loader.incProgress(translations.LB_AUTHENTICATING, 5);

			yield user.gatherUserInformation();

			loader.incProgress(translations.LB_LOADING_EMAILS, 5);

			/*var decodeChan = chan();
			co(function *() {
				while (!decodeChan.done()) {
					var status = yield decodeChan;

					if (status.current < status.total)
						loader.setProgress(LB_DECRYPTING, beforeDecryptingProgress + (status.current / status.total) * (95 - beforeDecryptingProgress));
					else
						loader.setProgress(LB_DECRYPTING, 95);
				}
			});*/

			yield inbox.initialize();

			loader.incProgress(translations.LB_LOADING_CONTACTS, 5);

			yield contacts.initialize();

			if ($state.current.name == 'empty')
				yield $state.go('main.label', {labelName: 'Inbox'}, {reload: true});

			$scope.isInitialized = true;
			return {lbDone: translations.LB_SUCCESS};
		} catch (error) {
			throw {message: translations.LB_INITIALIZATION_FAILED, error: error};
		}
	});

	$scope.onApplicationReady = () => {
		$rootScope.$broadcast('initialization-completed');
	};
});