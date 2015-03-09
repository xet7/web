module.exports = /*@ngInject*/($translate, hotkeys, $rootScope, $state) => {
    var hotkeyList = ['?'];
    var isActive = true;

    var Hotkey = function() {

    };

    Hotkey.addHotkey = (option) => {
        if (!isActive || angular.isUndefined(option))
            return;

        var key = angular.isArray(option.combo) ? option.combo[0] : option.combo;
        var currentKey = hotkeys.get(key);
        if (currentKey)
            hotkeys.del(currentKey);
        if (!hotkeyList.includes(option.combo)) {
            hotkeyList.push(option.combo);
        }

        option.description = $translate.instant(option.description);
        hotkeys.add(option);
    };

    Hotkey.toggleHotkeys = (enable) => {
        isActive = enable;
        if (enable) {
            Hotkey.addGlobalHotkeys();
        } else {
            Hotkey.clearHotkeys();
        }
    };

    Hotkey.clearHotkeys = () => {
        for (let key of hotkeyList) {
            if(key !== '?') {
                key = angular.isArray(key) ? key[0] : key;
                var hotkey = hotkeys.get(key);
                if (hotkey) {
                    hotkeys.del(hotkey);
                }
            }
        }
        hotkeyList = ['?'];

        console.log('Hotkeys', 'Removed all hotkeys');
    };

    Hotkey.addGlobalHotkeys = () => {
        Hotkey.addHotkey({
            combo: ['c', 'n'],
            description: 'HOTKEY.COMPOSE_EMAIL',
            callback: (event, key) => {
                event.preventDefault();
                $rootScope.showPopup('compose');
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+i', 'command+i'],
            description: 'HOTKEY.GOTO_INBOX',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.inbox.label', {labelName: 'Inbox'});
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+d', 'command+d'],
            description: 'HOTKEY.GOTO_DRAFTS',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.inbox.label', {labelName: 'Drafts'});
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+s', 'command+s'],
            description: 'HOTKEY.GOTO_SENT',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.inbox.label', {labelName: 'Sent'});
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+m', 'command+m'],
            description: 'HOTKEY.GOTO_SPAM',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.inbox.label', {labelName: 'Spam'});
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+t', 'command+t'],
            description: 'HOTKEY.GOTO_STARRED',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.inbox.label', {labelName: 'Starred'});
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+h', 'command+h'],
            description: 'HOTKEY.GOTO_TRASH',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.inbox.label', {labelName: 'Trash'});
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+x', 'command+x'],
            description: 'HOTKEY.GOTO_CONTACTS',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.contacts');
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+e', 'command+e'],
            description: 'HOTKEY.GOTO_SETTINGS',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.settings.general');
            }
        });

        Hotkey.addHotkey({
            combo: '/',
            description: 'HOTKEY.FOCUS_ON_SEARCH',
            callback: (event, key) => {
                if($rootScope.isPopupState($state.current.name) === false){
                    event.preventDefault();
                    document.getElementById('top-search').focus();
                }
            }
        });

        Hotkey.addHotkey({
            combo: 'esc',
            description: 'HOTKEY.LEAVE_FROM_SEARCH',
            callback: (event, key) => {
                if($rootScope.isPopupState($state.current.name) === false) {
                    event.preventDefault();
                    document.getElementById('top-search').blur();
                }
            },
            allowIn: ['INPUT']
        });

        console.log('Hotkeys', 'Added global hotkeys');
    };

    Hotkey.addSettingsNavigationHotkeys = () => {
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

    return Hotkey;
};