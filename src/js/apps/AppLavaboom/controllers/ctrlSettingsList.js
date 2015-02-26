module.exports = /*@ngInject*/($rootScope, $scope, $state, $timeout, $interval, $stateParams, co, user, inbox, consts, Hotkey) => {

    Hotkey.addSettingsNavigationHotkeys();

    $rootScope.$on('$stateChangeStart', (e, toState) => {
        if (toState.name.startsWith('main.settings') && $rootScope.isPopupState(toState.name) === false) {
            Hotkey.addSettingsNavigationHotkeys();
        }
    });
};