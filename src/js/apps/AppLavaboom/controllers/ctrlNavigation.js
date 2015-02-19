module.exports = /*@ngInject*/($scope, $state, inbox, user, hotkeys) => {
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

    hotkeys.add({
        combo: '/',
        description: 'Focus on search',
        callback: focusOnSearch
    });
};