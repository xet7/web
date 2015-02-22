module.exports = /*@ngInject*/($rootScope, $scope, $state, inbox, user, Hotkey) => {
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

    Hotkey.addHotkey({
        combo: '/',
        description: 'HOTKEY.HK_FOCUS_ON_SEARCH',
        callback: focusOnSearch
    });

    Hotkey.addHotkey({
        combo: 'esc',
        description: 'HOTKEY.HK_LEAVE_FROM_SEARCH',
        callback: leaveFromSearch,
        allowIn: ['INPUT']
    });

    Hotkey.addHotkey({
        combo: 'c+n',
        description: 'HOTKEY.HK_COMPOSE_EMAIL',
        callback: (event, key) => {
            event.preventDefault();
            $rootScope.showPopup('compose');
        }
    });
};