angular.module('AppLavaboom').controller('CtrlCompose', function($scope, $stateParams, user, contacts, inbox) {
	$scope.disabled = false;

	var threadId = $stateParams.threadId;

	console.log('Compose wow, thread id: ', threadId);

	$scope.$bind('contacts-changed', () => {
		$scope.people = contacts.people;

		var thread = inbox.threads[threadId];
		if (thread) {
			console.log('thread if', thread.headerEmail.from, thread.headerEmail.from.map(e => contacts.getContactByEmail(e)));
			$scope.form = {
				person: {},
				selected: {
					to: thread.headerEmail.from.map(e => contacts.getContactByEmail(e)),
					cc: [],
					bcc: [],
					from: contacts.myself
				},
				fromEmails: [contacts.myself],
				subject: `Re: ${thread.headerEmail.subject}`,
				body: ''
			};
		} else
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
				body: '<p>Dear Orwell</p><p>Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Sed porttitor lectus nibh. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Donec sollicitudin molestie malesuada. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Donec rutrum congue leo eget malesuada. Sed porttitor lectus nibh. Curabitur aliquet quam id dui posuere blandit. Nulla porttitor accumsan tincidunt.</p><blockquote><p>See, there never was actually any spoon. It was just lying around the production set.</p></blockquote>'
			};

		console.log(user.settings);
		if (user.settings.isSignatureEnabled && user.settings.signatureHtml)
			$scope.form.body = $scope.form.body + user.settings.signatureHtml;
	});

	$scope.clearTo = () => $scope.form.selected.to = [];
	$scope.clearCC = () => $scope.form.selected.cc = [];
	$scope.clearBCC = () => $scope.form.selected.bcc = [];

	$scope.send = () => {
		inbox.send(
			$scope.form.selected.to.map(e => e.email),
			$scope.form.selected.cc.map(e => e.email),
			$scope.form.selected.bcc.map(e => e.email),
			$scope.form.subject,
			$scope.form.body,
			threadId
		);
	};

	$scope.tagTransform = function (newTag) {
		return  {
			name: newTag,
			email: newTag.toLowerCase() + '@email.com',
			sec: 'unknown'
		};
	};

	$scope.enable = function() {
		$scope.disabled = false;
	};

	$scope.disable = function() {
		$scope.disabled = true;
	};
});
