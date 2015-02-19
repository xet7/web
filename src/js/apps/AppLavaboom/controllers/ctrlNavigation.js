module.exports = /*@ngInject*/($rootScope, $scope, $state, inbox, user, hotkeys) => {
	$scope.$state = $state;

	$scope.$bind('inbox-labels', () => {
		$scope.labelsByName = inbox.labelsByName;
	});

	$scope.logout = () => {
		user.logout();
	};

    // Add hotkeys
    var focusOnSearch = (event, key) => {
        event.preventDefault();
        document.getElementById('top-search').focus();
    };

    var leaveFromSearch = (event, key) => {
        event.preventDefault();
        document.getElementById('top-search').blur();
    };

    hotkeys.add({
        combo: '/',
        description: 'Focus on search',
        callback: focusOnSearch
    });

    hotkeys.add({
        combo: 'esc',
        description: 'Leave from search',
        callback: leaveFromSearch,
        allowIn: ['INPUT']
    });

    hotkeys.add({
        combo: 'c+n',
        description: 'Compose new email',
        callback: (event, key) => {
            event.preventDefault();
            $rootScope.showPopup('compose');
        }
    });
};