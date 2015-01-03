angular.module(primaryApplicationName).controller('CtrlLava', function($scope, inbox) {
	$scope.switch = 'off';

	var setInboxCount = (inboxCount = 0) => {
		$scope.inboxCount = inboxCount;
		$scope.inboxCountBadge = $scope.inboxCount > 0 ? ($scope.inboxCount <= 999 ? $scope.inboxCount : '999+') : '';
	};

	setInboxCount();

	$scope.$on('inbox-emails', () => {
		setInboxCount(inbox.totalEmailsCount);
	});
});
