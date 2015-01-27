var chan = require('chan');

angular.module(primaryApplicationName).controller('CtrlLavaboom', function($q, $rootScope, $timeout, $scope, $state, $translate, co, crypto, cryptoKeys, user, inbox, loader, router) {
	var
		beforeDecryptingProgress;

	const
		LB_INITIALIZING_OPENPGP = $translate.instant('LOADER.LB_INITIALIZING_OPENPGP'),
		LB_AUTHENTICATING = $translate.instant('LOADER.LB_AUTHENTICATING'),
		LB_DECRYPTING = $translate.instant('LOADER.LB_DECRYPTING'),
		LB_LOADING_EMAILS = $translate.instant('LOADER.LB_LOADING_EMAILS'),
		LB_INITIALIZATION_FAILED = $translate.instant('LOADER.LB_INITIALIZATION_FAILED'),
		LB_SUCCESS = $translate.instant('LOADER.LB_SUCCESS');

	$scope.isInitialized = false;

	$scope.initializeApplication = () => co(function *(){
		try {
			loader.incProgress(LB_INITIALIZING_OPENPGP, 1);

			crypto.initialize();

			loader.incProgress(LB_AUTHENTICATING, 5);

			yield user.gatherUserInformation();

			loader.incProgress(LB_LOADING_EMAILS, 5);

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

			if ($state.current.name == 'empty')
				yield $state.go('main.label', {labelName: 'Inbox'}, {reload: true});

			$scope.isInitialized = true;
			return {lbDone: LB_SUCCESS};
		} catch (error) {
			throw {message: LB_INITIALIZATION_FAILED, error: error};
		}
	});

	$scope.onApplicationReady = () => {
		$rootScope.$broadcast('initialization-completed');
	};
});