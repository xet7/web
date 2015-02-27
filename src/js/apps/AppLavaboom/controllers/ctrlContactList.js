module.exports = /*@ngInject*/($rootScope, $scope, $translate, $state, $stateParams, co, contacts, user, Hotkey) => {
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
			var index = $scope.people[letter].findIndex(c => c.id == cid);
			if (index < 0) {
				letterIndex++;
				continue;
			}
			return {
				letterIndex: letterIndex,
				index: index
			};
		}

		return null;
	};

	var nextContactId = (pos, delta = 0) => {
		var peopleByLetter;

		if ($scope.letters.length < 1)
			return null;

		if (pos.letterIndex > $scope.letters.length - 1) {
			pos.letterIndex = $scope.letters.length - 1;

			peopleByLetter = $scope.people[$scope.letters[pos.letterIndex]];
			pos.index = peopleByLetter.length - 1;
		} else peopleByLetter = $scope.people[$scope.letters[pos.letterIndex]];

		pos.index += delta;

		if (pos.index > peopleByLetter.length - 1) {
			if (pos.letterIndex < $scope.letters.length - 1) {
				peopleByLetter = $scope.people[$scope.letters[pos.letterIndex + 1]];
				return peopleByLetter[0].id;
			}
			return peopleByLetter[peopleByLetter.length - 1].id;
		}
		if (pos.index < 0) {
			if (pos.letterIndex > 0) {
				peopleByLetter = $scope.people[$scope.letters[pos.letterIndex - 1]];
				return peopleByLetter[peopleByLetter.length - 1].id;
			}
			return peopleByLetter[0].id;
		}

		return peopleByLetter[pos.index].id;
	};

	$scope.$bind('contacts-changed', () => {
		var oldContactPosition = $scope.selectedContactId !== null ? findContact($scope.selectedContactId) : null;

		console.log('contacts-changed, $scope.selectedContactId', $scope.selectedContactId, 'oldContactPosition', oldContactPosition);

		$scope.list = [...contacts.people.values()].filter(c => !c.isPrivate());
		$scope.people = _.groupBy($scope.list, contact => {
			if (contact.isNew)
				return '+';

			if (!contact.name)
				return '?';

			return contact.getSortingField(user.settings.contactsSortBy)[0];
		});
		$scope.letters = _.sortBy(Object.keys($scope.people), letter => letter);

		if (oldContactPosition !== null)
			$state.go('main.contacts.profile', {contactId: nextContactId(oldContactPosition)});
	});

	$scope.newContact = () => co(function *(){
		yield $state.go('main.contacts.profile', {contactId: 'new'});
	});

	let stateChangeSuccess = $scope.$bind('$stateChangeSuccess', () => {
		$scope.selectedContactId = $stateParams.contactId;

		const addHotkeys = () => {
			const moveContacts = function(delta) {
				console.log('move contacts', delta);
				var oldContactPosition = $scope.selectedContactId !== null ? findContact($scope.selectedContactId) : null;

				if (oldContactPosition) {
					var cid = nextContactId(oldContactPosition, delta);
					$state.go('main.contacts.profile', {contactId: cid});
				}
			};

			const moveUp = (event, key) => {
				event.preventDefault();
				moveContacts(-1);
			};

			const moveDown = (event, key) => {
				event.preventDefault();
				moveContacts(1);
			};

			console.log('add hotkeys up/down');

			Hotkey.addHotkey({
				combo: ['h', 'k', 'left', 'up'],
				description: 'HOTKEY.MOVE_UP',
				callback: moveUp
			});

			Hotkey.addHotkey({
				combo: ['j', 'l', 'right', 'down'],
				description: 'HOTKEY.MOVE_DOWN',
				callback: moveDown
			});
		};

		addHotkeys();
	});

	$scope.$on('$destroy', () => {
		stateChangeSuccess();
	});
};
