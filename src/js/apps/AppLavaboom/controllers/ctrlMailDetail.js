angular.module(primaryApplicationName).controller('CtrlMailDetail', function($scope, inbox) {
	$scope.selected = null;
	$scope.emails = [];

	$scope.$on('inbox-selection-changed', (e, selected) => {
		console.log(selected);
		$scope.selected = selected;

		if (selected)
			inbox.getEmailsByThreadId(selected.id)
				.then(emails => {
					$scope.emails = emails;
				});
	});
});
