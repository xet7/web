angular.module('AppLavaboom').controller('CtrlCompose', function($scope, contacts) {
	$scope.people = contacts.people;
	$scope.$on('contacts-changed', () => {
		$scope.people = contacts.people;
	});

	$scope.form = {
		person: {},

		selected: {
			to: [contacts.myself],
			cc: [],
			bcc: [],
			from: contacts.myself
		},
		fromEmails: [contacts.myself],
		subject: 'Test subject',
		body: '<p>Dear Orwell</p><p>Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Sed porttitor lectus nibh. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Donec sollicitudin molestie malesuada. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Donec rutrum congue leo eget malesuada. Sed porttitor lectus nibh. Curabitur aliquet quam id dui posuere blandit. Nulla porttitor accumsan tincidunt.</p><blockquote><p>See, there never was actually any spoon. It was just lying around the production set.</p></blockquote><p>Sincerely</p><p>Al Coholic<br/>C.E.O<br/>Starship Enterprise(s)</p>'
	};

	$scope.tagTransform = function (newTag) {
		var item = {
			name: newTag,
			email: newTag.toLowerCase() + '@email.com',
			sec: 'unknown'
		};

		return item;
	};

	$scope.disabled = false;

	$scope.enable = function() {
		$scope.disabled = false;
	};

	$scope.disable = function() {
		$scope.disabled = true;
	};

	$scope.clear = function() {
		$scope.person.selected = undefined;
		$scope.address.selected = undefined;
	};
});