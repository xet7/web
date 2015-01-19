angular.module(primaryApplicationName).controller('CtrlMailList', function($rootScope, $scope, $interval, user, inbox, cryptoKeys) {
	$scope.choose = function(item) {
		$scope.selected = item;
	};

	$scope.delete = () => {
		inbox.requestDelete($scope.selected.id);
	};

	$scope.$on('inbox-emails', () => {
		$scope.items = inbox.emails;
	});

	$scope.items = inbox.emails;

	$scope.selected = null;

	$scope.$watch('selected', () => {
		$rootScope.$broadcast('inbox-selection-changed', $scope.selected);
	});
});