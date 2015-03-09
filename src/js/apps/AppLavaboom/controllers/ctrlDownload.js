module.exports = /*@ngInject*/($rootScope, $scope, $stateParams, $interval, $timeout, $translate, consts, co, inbox, router, saver) => {
	let [emailId, fileId] = [$stateParams.emailId, $stateParams.fileId];

	var timePassed = 0;
	var translations = {};

	$scope.progress = 0;
	$scope.label = '';

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_ACQUIRING = $translate.instant('INBOX.DOWNLOAD.LB_ACQUIRING');
		translations.LB_DOWNLOADING = $translate.instant('INBOX.DOWNLOAD.LB_DOWNLOADING');
		translations.LB_DECRYPTING = $translate.instant('INBOX.DOWNLOAD.LB_DECRYPTING');
		translations.LB_TAKES_MORE = $translate.instant('INBOX.DOWNLOAD.LB_TAKES_MORE');
		translations.LB_COMPLETED = $translate.instant('INBOX.DOWNLOAD.LB_COMPLETED');
		$scope.label = translations.LB_ACQUIRING;
	});

	// TODO: implement proper estimation
	var estimatedTime = 1000 * 3;

	console.log('downloading file. Email id', emailId, 'file id', fileId);

	var progressBarInterval = $interval(() => {
		$scope.progress = Math.floor(++timePassed / estimatedTime);
		if ($scope.progress >= 100) {
			$scope.label = translations.LB_TAKES_MORE;

			$interval.cancel(progressBarInterval);
		}
	}, 1000);

	co(function *(){
		let email = yield inbox.getEmailById(emailId);
		console.log('downloading file from email', 'email', email);

		$scope.label = translations.LB_DOWNLOADING;
		let fileData = yield inbox.downloadAttachment(emailId, fileId);

		let manifestFile = email.manifest.getFileById(fileId);
		saver.saveAs(fileData, manifestFile.filename);

		$scope.progress = 100;
		$scope.label = translations.LB_COMPLETED;
		$interval.cancel(progressBarInterval);

		$timeout(() => {
			router.hidePopup();
		}, consts.POPUP_AUTO_HIDE_DELAY);
	});
};