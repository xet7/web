module.exports = /*@ngInject*/($rootScope, $scope, $translate, $state, $stateParams, co, contacts, ContactEmail) => {
	$scope.contactId = $stateParams.contactId;

	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_NEW_CONTACT = $translate.instant('MAIN.CONTACTS.LB_NEW_CONTACT');
	});

	if ($scope.contactId == 'new') {
		$scope.details = contacts.newContact();
	} else {
		$scope.details = contacts.getContactById($scope.contactId);

		if (!$scope.details || $scope.details.isPrivate())
			$state.go('main.contacts');
	}

	$scope.$watchGroup(['details.firstName', 'details.lastName'], (newValues, oldValues) => {
		if (newValues[0] != oldValues[0] || newValues[1] != oldValues[1]) {
			var firstName = $scope.details.firstName ? $scope.details.firstName.trim() : '';
			var lastName = $scope.details.lastName ? $scope.details.lastName.trim() : '';

			$scope.details.name = firstName || lastName ? `${firstName} ${lastName}` : $scope.details.name;
		}
	});

	$scope.addNewPrivateEmail = () => {
		$scope.details.privateEmails.push(new ContactEmail($scope.details, {}, 'private'));
	};

	$scope.addNewBusinessEmail = () => {
		$scope.details.businessEmails.push(new ContactEmail($scope.details, {}, 'business'));
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