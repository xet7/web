angular.module(primaryApplicationName).controller('CtrlContactList', function($rootScope, $scope, $translate, $state, $stateParams, co, contacts, Contact) {
	$scope.selectedContactId = null;
	$scope.searchText = '';

	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_NEW_CONTACT_SHORT = $translate.instant('MAIN.CONTACTS.LB_NEW_CONTACT');
		translations.LB_EMPTY_CONTACT_SHORT = $translate.instant('MAIN.CONTACTS.LB_EMPTY_CONTACT');
	});

	$rootScope.whenInitialized(() => {
		$scope.$bind('contacts-changed', () => {
			$scope.people = _.groupBy(contacts.peopleList, contact => {
				if (contact.isNew)
					return '+';

				if (!contact.name)
					return '?';

				return contact.name[0];
			});
			$scope.letters = _.sortBy(Object.keys($scope.people), letter => letter);
		});

		$scope.newContact = () => co(function *(){
			yield $state.go('main.contacts.profile', {contactId: 'new'});
		});

		$scope.$bind('$stateChangeSuccess', () => {
			$scope.selectedContactId = $stateParams.contactId;
		});
	});
});
