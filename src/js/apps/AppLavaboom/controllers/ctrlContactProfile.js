angular.module(primaryApplicationName).controller('CtrlContactProfile', function($rootScope, $scope, $translate, $state, $stateParams, co, contacts) {
	$scope.contactId = $stateParams.contactId;

	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_NEW_CONTACT = $translate.instant('MAIN.CONTACTS.LB_NEW_CONTACT');
	});

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

	function ContactEmail () {
		this.email =  '';
		this.isStar = false;
		this.isCollapsed = true;
		this.key = null;
	}

	$scope.addNewPrivateEmail = () => {
		$scope.privateEmails.push(new ContactEmail());
	};

	$scope.addNewBusinessEmail = () => {
		$scope.businessEmails.push(new ContactEmail());
	};

	$scope.saveThisContact = () => co(function *(){

	});

	$scope.deleteThisContact = () => co(function *(){
		return yield contacts.deleteContact($scope.contactId);
	});

	$scope.downloadPublicKey = (key) => {

	};
});
