angular.module('AppLavaboom').controller('ComposeController', function($scope,  LavaboomAPI) {
	$scope.tags = [
		{ text: 'piggyslasher@gmail.com' },
		{ text: 'comegetsome@lavaboom.com' },
		{ text: 'nospoon@found.com' }
	];

	$scope.tags2 = [
		{ text: 'scissorhands@edwar.ds' },
		{ text: 'bogeyman3@mail.ru' }
	];

	$scope.tags3 = [
		{ text: 'rhymezene@gmail.com' },
		{ text: 'boogieman4@lavaboom.com' }
	];

	$scope.loadTags = function(query) {
		return [];//$http.get('/tags?query=' + query);
	};
});