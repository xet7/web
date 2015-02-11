angular.module(primaryApplicationName).controller('CtrlContacts', function($rootScope, $scope, $state, $stateParams, contacts) {
	$scope.$bind('$stateChangeSuccess', () => {
		$scope.selectedContactId = $stateParams.contactId;
	});

	$scope.searchText = '';

	$rootScope.whenInitialized(() => {
		$scope.people = contacts.people;
		$scope.sortedPeople = _.groupBy(contacts.people, contact => contact.name[0]);
	});
});
