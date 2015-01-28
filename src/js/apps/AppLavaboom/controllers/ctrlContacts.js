angular.module(primaryApplicationName).controller('CtrlContacts', function($rootScope, $scope, $state, $stateParams, contacts) {
	$scope.$bind('$stateChangeSuccess', () => {
		$scope.selectedContactId = $stateParams.contactId;
	});

	$scope.searchText = '';

	$scope.$bind('initialization-completed', () => {
		$scope.people = contacts.people;
		$scope.sortedPeople = _.groupBy(contacts.people, contact => contact.name[0]);
	});
});
