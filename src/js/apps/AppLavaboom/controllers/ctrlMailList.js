angular.module(primaryApplicationName).controller('CtrlMailList', function($rootScope, $scope, $interval, $stateParams, user, inbox, cryptoKeys) {
	$scope.$bind('inbox-threads', () => {
		$scope.threads = inbox.threads;
	});
	$scope.isLoading = false;
	$scope.selected = null;

	$scope.choose = function(item) {
		$scope.selected = item;
	};

	$scope.delete = () => {
		inbox.requestDelete($scope.selected.id);
	};

	$scope.star = () => {
		inbox.requestStar($scope.selected.id);
	};

	var requestList = () => {
		$scope.threads = [];
		$scope.isLoading = true;
		inbox.requestList($stateParams.labelName)
			.finally(() => {
				$scope.isLoading = false;
			});
	};

	if ($scope.isInitialized) {
		requestList();
	}
	else
		$rootScope.$on('initialization-completed', () => {
			requestList();
		});

	$scope.$watch('selected', () => {
		$rootScope.$broadcast('inbox-selection-changed', $scope.selected);
	});
});