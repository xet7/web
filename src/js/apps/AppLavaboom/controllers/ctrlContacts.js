angular.module(primaryApplicationName).controller('CtrlContacts', function($rootScope, $scope, $state, $stateParams, co, contacts, Contact) {
	$scope.selectedContactId = null;
	$scope.searchText = '';

	$rootScope.whenInitialized(() => {
		$scope.$bind('contacts-changed', () => {
			$scope.people = _.groupBy(contacts.peopleList, contact => contact.name[0]);
			$scope.letters = _.sortBy(Object.keys($scope.people), letter => letter);
		});

		$scope.newContact = () => co(function *(){
			var contact = contacts.newContact();
			yield $state.go('main.contacts.profile', {contactId: contact.id});
		});

		$scope.$bind('$stateChangeSuccess', () => {
			$scope.selectedContactId = $stateParams.contactId;
		});
	});
});
