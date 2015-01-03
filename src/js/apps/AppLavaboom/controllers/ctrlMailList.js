angular.module(primaryApplicationName).controller('CtrlMailList', function($scope, LavaboomAPI) {
	$scope.choose = function(item) {
		$scope.selected = item;
	};

	$scope.save = function() {
		$scope.selected = {};
	};

	LavaboomAPI.tokens.create($scope.login).then(function () {
		//debugger;
	}).catch(function () {
		//	debugger;
	});

	$scope.items = [{
		id: 3,
		sender: 'John Lava',
		subject: 'Lorem ipsum Sint commodo incididunt.',
		desc: "Velit exercitation proident irure Lorem ipsum Ex sint ut Excepteur ad Excepteur. proident irure ullamco dolor.",
	}, {
		id: 7,
		sender: 'Kais R. Sose',
		subject: "Ipsum Non in qui voluptate.",
		desc: "In labore dolor voluptate aute Excepteur Excepteur nostrud reprehenderit in et voluptate reprehenderit cupidatat nostrud officia fugiat minim ad in laboris est laborum deserunt dolore adipisicing nisi do in consectetur nostrud sint velit aliqua quis tempor."
	}, {
		id: 7,
		sender: 'Freddie Lownes',
		subject: "Ipsum Non in qui voluptate.",
		desc: "In labore dolor voluptate aute Excepteur Excepteur nostrud reprehenderit in et voluptate reprehenderit cupidatat nostrud officia fugiat minim ad in laboris est laborum deserunt dolore adipisicing nisi do in consectetur nostrud sint velit aliqua quis tempor."
	}, {
		id: 7,
		sender: 'Will Graham',
		subject: "Ipsum Non in qui voluptate.",
		desc: "In labore dolor voluptate aute Excepteur Excepteur nostrud reprehenderit in et voluptate reprehenderit cupidatat nostrud officia fugiat minim ad in laboris est laborum deserunt dolore adipisicing nisi do in consectetur nostrud sint velit aliqua quis tempor."
	}, {
		id: 7,
		sender: 'The Dude',
		subject: "Ipsum Non in qui voluptate.",
		desc: "In labore dolor voluptate aute Excepteur Excepteur nostrud reprehenderit in et voluptate reprehenderit cupidatat nostrud officia fugiat minim ad in laboris est laborum deserunt dolore adipisicing nisi do in consectetur nostrud sint velit aliqua quis tempor."
	}, {
		id: 7,
		sender: 'Bunny Petrecelli',
		subject: "Ipsum Non in qui voluptate.",
		desc: "In labore dolor voluptate aute Excepteur Excepteur nostrud reprehenderit in et voluptate reprehenderit cupidatat nostrud officia fugiat minim ad in laboris est laborum deserunt dolore adipisicing nisi do in consectetur nostrud sint velit aliqua quis tempor."
	}, {
		id: 7,
		sender: 'Dougie House M.D.',
		subject: "Ipsum Non in qui voluptate.",
		desc: "In labore dolor voluptate aute Excepteur Excepteur nostrud reprehenderit in et voluptate reprehenderit cupidatat nostrud officia fugiat minim ad in laboris est laborum deserunt dolore adipisicing nisi do in consectetur nostrud sint velit aliqua quis tempor."
	}, {
		id: 7,
		sender: 'Kais R. Sose',
		subject: "Ipsum Non in qui voluptate.",
		desc: "In labore dolor voluptate aute Excepteur Excepteur nostrud reprehenderit in et voluptate reprehenderit cupidatat nostrud officia fugiat minim ad in laboris est laborum deserunt dolore adipisicing nisi do in consectetur nostrud sint velit aliqua quis tempor."
	}, {
		id: 7,
		sender: 'Hank Aaron',
		subject: "Ipsum Non in qui voluptate.",
		desc: "In labore dolor voluptate aute Excepteur Excepteur nostrud reprehenderit in et voluptate reprehenderit cupidatat nostrud officia fugiat minim ad in laboris est laborum deserunt dolore adipisicing nisi do in consectetur nostrud sint velit aliqua quis tempor."
	}, {
		id: 7,
		sender: 'Bunny Coleson',
		subject: "Ipsum Non in qui voluptate.",
		desc: "In labore dolor voluptate aute Excepteur Excepteur nostrud reprehenderit in et voluptate reprehenderit cupidatat nostrud officia fugiat minim ad in laboris est laborum deserunt dolore adipisicing nisi do in consectetur nostrud sint velit aliqua quis tempor."
	}, {
		id: 7,
		sender: 'Bunny Coleson',
		subject: "Ipsum Non in qui voluptate.",
		desc: "In labore dolor voluptate aute Excepteur Excepteur nostrud reprehenderit in et voluptate reprehenderit cupidatat nostrud officia fugiat minim ad in laboris est laborum deserunt dolore adipisicing nisi do in consectetur nostrud sint velit aliqua quis tempor."
	}, {
		id: 7,
		sender: 'Bunny Coleson',
		subject: "Ipsum Non in qui voluptate.",
		desc: "In labore dolor voluptate aute Excepteur Excepteur nostrud reprehenderit in et voluptate reprehenderit cupidatat nostrud officia fugiat minim ad in laboris est laborum deserunt dolore adipisicing nisi do in consectetur nostrud sint velit aliqua quis tempor."
	}];

	$scope.selected = $scope.items[0];
});