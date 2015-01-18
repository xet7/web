angular.module(primaryApplicationName).controller('CtrlLavaboom', function($scope, $state, crypto, user, inbox) {
	$scope.switch = 'off';

	var setInboxCount = (inboxCount = 0) => {
		$scope.inboxCount = inboxCount;
		$scope.inboxCountBadge = $scope.inboxCount > 0 ? ($scope.inboxCount <= 999 ? $scope.inboxCount : '999+') : '';
	};

	setInboxCount();

	$scope.$on('inbox-emails', () => {
		setInboxCount(inbox.totalEmailsCount);
	});

	crypto.initialize();

	$scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
		if (!inbox.isDecrypted && toState.name != 'decrypting') {
			event.preventDefault();
			$state.go('decrypting');
		}
	});
});