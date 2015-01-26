angular.module(primaryApplicationName).controller('CtrlMailList', function($rootScope, $scope, $interval, $stateParams, user, inbox, cryptoKeys) {
	$scope.choose = function(item) {
		$scope.selected = item;
	};

	$scope.delete = () => {
		inbox.requestDelete($scope.selected.id);
	};

	$scope.star = () => {
		inbox.requestStar($scope.selected.id);
	};

	$scope.selected = null;

	$scope.$watch('selected', () => {
		$rootScope.$broadcast('inbox-selection-changed', $scope.selected);
	});

	$rootScope.$on('initialization-completed', () => {
		inbox.requestList($stateParams.labelName);
	});

	$scope.$bind('inbox-threads', () => {
		$scope.threads = inbox.threads;
	});
});