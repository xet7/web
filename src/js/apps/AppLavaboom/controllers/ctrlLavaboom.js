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

	user.checkAuth();

	$scope.$on('user-authenticated', () => {
		$state.go('decrypting');
	});

	var once = $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
		if (toState.name != 'loading') {
			event.preventDefault();
			$state.go('loading');
		}
		once();
	});
});
