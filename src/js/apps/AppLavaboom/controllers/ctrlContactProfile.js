module.exports = /*@ngInject*/($rootScope, $scope, $translate, $state, $stateParams, co, contacts) => {
	$scope.contactId = $stateParams.contactId;

	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_NEW_CONTACT = $translate.instant('MAIN.CONTACTS.LB_NEW_CONTACT');
	});

	if ($scope.contactId == 'new') {
		$scope.details = contacts.newContact();
	} else {
		$scope.details = contacts.getContactById($scope.contactId);

		if (!$scope.details)
			$state.go('main.contacts');
	}

	function ContactEmail () {
		this.email =  '';
		this.isStar = false;
		this.isCollapsed = true;
		this.key = null;
	}

	$scope.addNewPrivateEmail = () => {
		$scope.details.privateEmails.push(new ContactEmail());
	};

	$scope.addNewBusinessEmail = () => {
		$scope.details.businessEmails.push(new ContactEmail());
	};

	$scope.saveThisContact = () => co(function *(){
		if ($scope.details.id != 'new')
			yield contacts.updateContact($scope.details);
		else {
			var cid = yield contacts.createContact($scope.details);
			$state.go('main.contacts.profile', {contactId: cid});
		}
	});

	$scope.deleteThisContact = () => co(function *(){
		return yield contacts.deleteContact($scope.contactId);
	});
};