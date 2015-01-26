angular.module('AppLavaboom').controller('CtrlContacts', function($scope, contacts) {
	$scope.searchText = '';

	$scope.people = contacts.people;

	console.log ('people');
	console.log(contacts.people);

	console.log ('sortedpeople');
	console.log(contacts.sortedPeople);
	$scope.sortedPeople = contacts.sortedPeople;
	$scope.selectedPeople = contacts.people[0];

});
