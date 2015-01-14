angular.module(primaryApplicationName).controller('CtrlMailDetail', function($scope, inbox) {
	$scope.selected = null;

	$scope.$on('inbox-selection-changed', (e, selected) => {
		$scope.selected = selected;
	});
});
