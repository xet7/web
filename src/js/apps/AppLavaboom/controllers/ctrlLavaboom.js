var chan = require('chan');
var sleep = require('chan');

angular.module(primaryApplicationName).controller('CtrlLavaboom', function($q, $scope, $state, $translate, co, crypto, cryptoKeys, user, inbox, loader) {
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

			var decodeChan = chan();
			var initializePromise = inbox.initialize(decodeChan);

			co(function *() {
				var status;
				while (true) {
					status = yield decodeChan;
					if (!status)
						break;

					console.log('status', status);

					yield sleep(1000);

					if (status.current < status.total)
						loader.setProgress(LB_DECRYPTING, beforeDecryptingProgress + (status.current / status.total) * (95 - beforeDecryptingProgress));
				}
				console.log('decode ended?', status);
			});

			yield initializePromise;
			yield cryptoKeys.syncKeys();

			yield $state.go('main.label', {labelName: 'Inbox'}, {reload: true});

			$scope.isInitialized = true;
			return {lbDone: LB_SUCCESS};
		} catch (error) {
			throw {message: LB_INITIALIZATION_FAILED, error: error};
		}
	});
});