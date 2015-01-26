angular.module(primaryApplicationName).controller('CtrlMailDetail', function($scope, inbox) {
	$scope.isLoading = false;
	$scope.selected = null;
	$scope.emails = [];

	$scope.$on('inbox-selection-changed', (e, selected) => {
		$scope.selected = selected;

		if (selected) {
			$scope.isLoading = true;
			$scope.emails = [];
			inbox.getEmailsByThreadId(selected.id)
				.then(emails => {
					$scope.emails = emails;
				})
				.finally(() => {
					$scope.isLoading = false;
				});
		}
	});
});
