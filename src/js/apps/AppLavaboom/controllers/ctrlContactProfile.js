angular.module(primaryApplicationName).controller('CtrlContactProfile', function($rootScope, $scope, $state, $stateParams, co, contacts) {
	$scope.contactId = $stateParams.contactId;

	$rootScope.whenInitialized(() => {
		if ($scope.contactId == 'new') {
			$scope.details = contacts.newContact();
		} else {
			$scope.details = contacts.getContactById($scope.contactId);

			if (!$scope.details)
				$state.go('main.contacts');
		}

		$scope.privateEmails = [
			/*{
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
			}*/
		];

		$scope.businessEmails = [
			/*{
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
			}*/
		];
	});

	$scope.deleteThisContact = () => co(function *(){
		return yield contacts.deleteContact($scope.contactId);
	});

	$scope.downloadPublicKey = (key) => {

	};
});
