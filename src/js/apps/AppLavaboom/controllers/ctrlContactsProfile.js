angular.module(primaryApplicationName).controller('CtrlContactsProfile', function($rootScope, $scope, $stateParams, contacts) {
	var contactId = $stateParams.contactId;
	console.log(contactId);

	$rootScope.whenInitialized(() => {
		console.log('contacts.getContactById', contactId, contacts.people);
		$scope.details = contacts.getContactById(contactId);
		console.log('$scope.details', $scope.details);

		$scope.emails = [
			{
				type: 'private',
				email: 'house.stark@gmail.com',
				isStar: false,
				isCollapsed: false,
				key: {
					keyId: '62CEB525',
					length: '4096',
					algos: 'RSA',
					fingerprint: '62CE62CEB52562CEB62CEB525525B525'
				}
			},
			{
				type: 'business',
				email: 'ned@stark.com',
				isStar: false,
				isCollapsed: false,
				key: {
					keyId: '62CEB525',
					length: '4096',
					algos: 'RSA',
					fingerprint: '62CE62CEB52562CEB62CEB525525B525'
				}
			}
		];
	});



	$scope.downloadPublicKey = (key) => {

	};
});
