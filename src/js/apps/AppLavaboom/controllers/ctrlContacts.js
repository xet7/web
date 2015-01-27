angular.module(primaryApplicationName).controller('CtrlContacts', function($scope, contacts) {
	$scope.searchText = '';

	$scope.$bind('contacts-changed', () => {
		$scope.people = contacts.people;
		$scope.sortedPeople = _.groupBy(contacts.people, contact => contact.name[0]);
	});

	$scope.selectedPeople = null;
});
