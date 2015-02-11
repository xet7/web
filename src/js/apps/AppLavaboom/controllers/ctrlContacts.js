angular.module(primaryApplicationName).controller('CtrlContacts', function($rootScope, $scope, $state, $stateParams, contacts) {
	$scope.selectedContactId = null;

	$scope.$bind('$stateChangeSuccess', () => {
		$scope.selectedContactId = $stateParams.contactId;
	});

	$scope.searchText = '';

	$rootScope.whenInitialized(() => {
		$scope.$bind('contacts-changed', () => {
			$scope.people = _.groupBy(contacts.peopleList, contact => contact.name[0]);
			$scope.letters = _.sortBy(Object.keys($scope.people), letter => letter);
		});
	});
});
