angular.module(primaryApplicationName).controller('CtrlMailList', function($scope, user, inbox) {
	$scope.choose = function(item) {
		$scope.selected = item;
	};

	$scope.save = function() {
		$scope.selected = {};
	};

	user.singIn('let4be', 'ztest007');

	$scope.$on('user-authenticated', () => {
		inbox.requestList();
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
