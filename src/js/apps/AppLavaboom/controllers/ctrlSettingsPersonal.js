angular.module(primaryApplicationName).controller('ctrlSettingsPersonal', function($scope, user) {
	$scope.username = user.name;

	console.log('$scope.username', $scope.username);

	$scope.settings = user.settings;

	$scope.signature='<img src="https://mail.lavaboom.io/img/Lavaboom-logo.svg" style="float: left;"/><p><br>Felix von Looz<br>Head of Design, Lavaboom<br><a href="mailto:fvl@lavaboom.com">fvl@lavaboom.com</a><br><br>P.s. <em>Still reading?</em> Hurry and get your secure email at lavaboom.com</p>';
});