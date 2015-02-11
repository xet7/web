angular.module(primaryApplicationName).controller('CtrlContactsProfile', function($rootScope, $scope, $stateParams, co, contacts) {
	$scope.contactId = $stateParams.contactId;

	$rootScope.whenInitialized(() => {
		$scope.details = contacts.getContactById($scope.contactId);

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

	$scope.deleteThisContact = () => co(function *(){
		return yield contacts.deleteContact($scope.contactId);
	});

	$scope.downloadPublicKey = (key) => {

	};
});
