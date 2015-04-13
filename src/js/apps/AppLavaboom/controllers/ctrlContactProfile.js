module.exports = /*@ngInject*/($rootScope, $scope, $translate, $state, $stateParams, co, contacts, notifications, ContactEmail) => {
	$scope.contactId = $stateParams.contactId;
	const email = $stateParams.email;

	$scope.isEditMode = $scope.contactId == 'new';

	const translations = {
		LB_NEW_CONTACT: '',
		LB_CONTACT_CANNOT_BE_SAVED: '',
		LB_CONTACT_SAVED: '',
		LB_CONTACT_DELETED: '',
		LB_CONTACT_CANNOT_BE_DELETED: ''
	};
	$translate.bindAsObject(translations, 'MAIN.CONTACTS');

	$rootScope.$bind('notifications', () => {
		$scope.notificationsInfo = notifications.get('info', 'contact.profile');
		$scope.notificationsWarning = notifications.get('warning', 'contact.profile');
	});

	console.log('ctrl contact profile', $scope.contactId);

	if ($scope.contactId == 'new') {
		$scope.details = contacts.newContact();
		if (email && !$scope.details.getEmail(email))
			$scope.details.privateEmails.push(new ContactEmail($scope.details, {name: email}, 'private'));
	} else {
		$scope.details = contacts.getContactById($scope.contactId);

		if (!$scope.details || $scope.details.isHidden())
			$state.go('main.contacts');
	}

	$scope.$watchGroup(['details.firstName', 'details.lastName'], (newValues, oldValues) => {
		if (newValues[0] != oldValues[0] || newValues[1] != oldValues[1]) {
			let firstName = $scope.details.firstName ? $scope.details.firstName.trim() : '';
			let lastName = $scope.details.lastName ? $scope.details.lastName.trim() : '';

			$scope.details.name = firstName || lastName ? `${firstName} ${lastName}` : $scope.details.name;
		}
	});

	$scope.addNewPrivateEmail = () => {
		$scope.details.privateEmails.push(new ContactEmail($scope.details, {}, 'private'));
	};

	$scope.addNewBusinessEmail = () => {
		$scope.details.businessEmails.push(new ContactEmail($scope.details, {}, 'business'));
	};

	let originalContact = null;

	$scope.openEditMode = () => {
		originalContact = angular.copy($scope.details);
		$scope.isEditMode = true;
	};

	$scope.cancelEditMode = () => {
		$scope.isEditMode = false;
		$scope.details.setFromAnotherContact(originalContact);
	};

	$scope.saveThisContact = () => co(function *(){
		try {
			if ($scope.details.id != 'new')
				yield contacts.updateContact($scope.details);
			else {
				let cid = yield contacts.createContact($scope.details);
				$state.go('main.contacts.profile', {contactId: cid});
			}

			$scope.isEditMode = false;
		} catch (err) {
			notifications.set('contact-save-fail', {
				text: translations.LB_CONTACT_CANNOT_BE_SAVED,
				namespace: 'contact.profile'
			});
			throw err;
		}
	});

	$scope.deleteThisContact = () => co(function *(){
		try {
			yield contacts.deleteContact($scope.contactId);

			notifications.set('contact-delete-ok', {
				text: translations.LB_CONTACT_DELETED,
				type: 'info',
				timeout: 3000,
				namespace: 'contact.profile'
			});
		} catch (err) {
			notifications.set('contact-delete-fail', {
				text: translations.LB_CONTACT_CANNOT_BE_DELETED,
				namespace: 'contact.profile'
			});
			throw err;
		}
	});
};