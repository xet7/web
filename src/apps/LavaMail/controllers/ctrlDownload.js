module.exports = ($rootScope, $scope, $stateParams, $interval, $timeout, $translate, consts, co, inbox, router, saver) => {
	let [emailId, fileId] = [$stateParams.emailId, $stateParams.fileId];

	let timePassed = 0;
	// TODO: implement proper estimation
	let estimatedTime = 1000 * 3;

	$scope.progress = 0;
	$scope.label = '';

	const translations = {
		LB_ACQUIRING : '',
		LB_DOWNLOADING : '',
		LB_DECRYPTING : '',
		LB_TAKES_MORE : '',
		LB_COMPLETED : ''
	};

	$translate.bindAsObject(translations, 'LAVAMAIL.INBOX.DOWNLOAD', null, () => {
		$scope.label = translations.LB_ACQUIRING;
	});

	console.log('downloading file. Email id', emailId, 'file id', fileId);

	let progressBarInterval = $interval(() => {
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