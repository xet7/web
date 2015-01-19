angular.module(primaryApplicationName).controller('ctrlSettingsPersonal', function($scope, user) {
	$scope.username = user.name;

	console.log('$scope.username', $scope.username);

	$scope.settings = user.settings;
});