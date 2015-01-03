angular.module(primaryApplicationName).controller('CtrlMailList', function($scope, user, inbox, cryptoKeys) {
	$scope.choose = function(item) {
		$scope.selected = item;
	};

	$scope.save = function() {
		$scope.selected = {};
	};

	user.singIn('let4be-1', 'ztest007');

	$scope.$on('user-authenticated', () => {
		inbox.requestList();
		cryptoKeys.syncKeys();
		inbox.send('let4be-1@lavaboom.io', 'test PGP subject', 'test PGP body');
	});

	$scope.$on('inbox-emails', () => {
		$scope.items = inbox.emails;
	});

	/*
	{
		id: 3,
		sender: 'John Lava',
		subject: 'Lorem ipsum Sint commodo incididunt.',
		desc: "Velit exercitation proident irure Lorem ipsum Ex sint ut Excepteur ad Excepteur. proident irure ullamco dolor.",
	}
	*/

	$scope.items = inbox.emails;

	$scope.selected = null;
});
