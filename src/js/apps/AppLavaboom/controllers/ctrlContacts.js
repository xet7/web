angular.module(primaryApplicationName).controller('CtrlContacts', function($scope, contacts) {
	$scope.singleModel = 1;
	$scope.singleModel2 = 0;

	$scope.searchText = '';

	$scope.people = contacts.people;

	$scope.isCollapsed = 1;

	$scope.sortedPeople = contacts.sortedPeople;
	$scope.selectedPeople = contacts.people[0];

});
