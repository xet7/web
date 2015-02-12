angular.module(primaryApplicationName).controller('CtrlContactList', function($rootScope, $scope, $translate, $state, $stateParams, co, contacts, Contact) {
	$scope.selectedContactId = null;
	$scope.searchText = '';

	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_NEW_CONTACT_SHORT = $translate.instant('MAIN.CONTACTS.LB_NEW_CONTACT');
		translations.LB_EMPTY_CONTACT_SHORT = $translate.instant('MAIN.CONTACTS.LB_EMPTY_CONTACT');
	});

	var findContact = (cid) => {
		var letterIndex = 0;
		for(let letter of $scope.letters) {
			console.log('findContact, letter', letter);
			var index = 0;
			for (let contact of $scope.people[letter]) {
				if (contact.id == cid)
					return {
						letterIndex: letterIndex,
						index: index
					};
				index++;
			}
			letterIndex++;
		}

		return null;
	};

	var nextContactId = (pos) => {
		var peopleByLetter;

		if ($scope.letters.length < 1)
			return null;

		if (pos.letterIndex > $scope.letters.length - 1) {
			peopleByLetter = $scope.people[$scope.letters[$scope.letters.length - 1]];
			return peopleByLetter[peopleByLetter.length -1].id;
		}

		peopleByLetter = $scope.people[$scope.letters[pos.letterIndex]];
		if (pos.index > peopleByLetter.length - 1)
			return peopleByLetter[peopleByLetter.length - 1].id;

		return peopleByLetter[pos.index].id;
	};

	$rootScope.whenInitialized(() => {
		$scope.$bind('contacts-changed', () => {
			var oldContactPosition = $scope.selectedContactId !== null ? findContact($scope.selectedContactId) : null;

			console.log('contacts-changed, $scope.selectedContactId', $scope.selectedContactId, 'oldContactPosition', oldContactPosition);

			$scope.list = contacts.peopleList;
			$scope.people = _.groupBy(contacts.peopleList, contact => {
				if (contact.isNew)
					return '+';

				if (!contact.name)
					return '?';

				return contact.name[0];
			});
			$scope.letters = _.sortBy(Object.keys($scope.people), letter => letter);

			if (oldContactPosition !== null)
				$state.go('main.contacts.profile', {contactId: nextContactId(oldContactPosition)});
		});

		$scope.newContact = () => co(function *(){
			yield $state.go('main.contacts.profile', {contactId: 'new'});
		});

		$scope.$bind('$stateChangeSuccess', () => {
			$scope.selectedContactId = $stateParams.contactId;
		});
	});
});
