module.exports = /*@ngInject*/($rootScope, $scope, $state, $timeout, $interval, $stateParams, co, user, inbox, consts, Hotkey) => {

    var addHotkeys = function() {
        Hotkey.addHotkey({
            combo: ['h', 'k', 'left', 'up'],
            description: 'HOTKEY.MOVE_UP',
            callback: (event, key) => {
                event.preventDefault();
                switch ($state.current.name) {
                    case 'main.settings.general':
                        $state.go('main.settings.plan');
                        break;
                    case 'main.settings.profile':
                        $state.go('main.settings.general');
                        break;
                    case 'main.settings.security':
                        $state.go('main.settings.profile');
                        break;
                    case 'main.settings.plan':
                        $state.go('main.settings.security');
                        break;
                    default:
                        break;
                }
            }
        });

        Hotkey.addHotkey({
            combo: ['j', 'l', 'right', 'down'],
            description: 'HOTKEY.MOVE_DOWN',
            callback: (event, key) => {
                event.preventDefault();
                switch ($state.current.name) {
                    case 'main.settings.general':
                        $state.go('main.settings.profile');
                        break;
                    case 'main.settings.profile':
                        $state.go('main.settings.security');
                        break;
                    case 'main.settings.security':
                        $state.go('main.settings.plan');
                        break;
                    case 'main.settings.plan':
                        $state.go('main.settings.general');
                        break;
                    default:
                        break;
                }
            }
        });

        console.log('Hotkeys', 'Added settings navigation hotkeys');
    };

    addHotkeys();

    $rootScope.$on('$stateChangeStart', (e, toState) => {
        if (toState.name.startsWith('main.settings') && $rootScope.isPopupState(toState.name) === false) {
            addHotkeys();
        }
    });
};