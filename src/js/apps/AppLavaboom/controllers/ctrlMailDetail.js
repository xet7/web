angular.module(primaryApplicationName).controller('CtrlMailDetail', function($scope, inbox) {
	$scope.isLoading = false;
	$scope.selectedTid = null;
	$scope.emails = [];

	$scope.$on('inbox-selection-changed', (e, selectedTid) => {
		$scope.selectedTid = selectedTid;

		if (selectedTid !== null) {
			$scope.isLoading = true;
			$scope.emails = [];
			inbox.getEmailsByThreadId(selectedTid)
				.then(emails => {
					$scope.emails = emails;
				})
				.finally(() => {
					$scope.isLoading = false;
				});
		}
	});
});
