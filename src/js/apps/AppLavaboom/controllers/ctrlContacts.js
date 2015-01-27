angular.module(primaryApplicationName).controller('CtrlContacts', function($rootScope, $scope, $stateParams, contacts) {
	$scope.$bind('$stateChangeSuccess', () => {
		$scope.selectedContactId = $stateParams.contactId;
		console.log('$scope.selectedContactId', $scope.selectedContactId);
	});

	$scope.searchText = '';

	$scope.$bind('initialization-completed', () => {
		$scope.people = contacts.people;
		$scope.sortedPeople = _.groupBy(contacts.people, contact => contact.name[0]);
	});
});
