module.exports = /*@ngInject*/($translate, hotkeys, $rootScope, $state) => {
    var hotkeyList = ['?'];
    var active = true;

    var Hotkey = function() {

    };

    Hotkey.addHotkey = (option) => {
        if (!active || angular.isUndefined(option))
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
        active = enable;
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
    };

    Hotkey.addGlobalHotkeys = () => {
        Hotkey.addHotkey({
            combo: ['c', 'n'],
            description: 'HOTKEY.HK_COMPOSE_EMAIL',
            callback: (event, key) => {
                event.preventDefault();
                $rootScope.showPopup('compose');
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+i', 'command+i'],
            description: 'HOTKEY.HK_GOTO_INBOX',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.inbox.label', {labelName: 'Inbox'});
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+d', 'command+d'],
            description: 'HOTKEY.HK_GOTO_DRAFTS',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.inbox.label', {labelName: 'Drafts'});
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+s', 'command+s'],
            description: 'HOTKEY.HK_GOTO_SENT',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.inbox.label', {labelName: 'Sent'});
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+m', 'command+m'],
            description: 'HOTKEY.HK_GOTO_SPAM',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.inbox.label', {labelName: 'Spam'});
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+t', 'command+t'],
            description: 'HOTKEY.HK_GOTO_STARRED',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.inbox.label', {labelName: 'Starred'});
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+h', 'command+h'],
            description: 'HOTKEY.HK_GOTO_TRASH',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.inbox.label', {labelName: 'Trash'});
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+c', 'command+c'],
            description: 'HOTKEY.HK_GOTO_CONTACTS',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.contacts');
            }
        });

        Hotkey.addHotkey({
            combo: ['ctrl+e', 'command+e'],
            description: 'HOTKEY.HK_GOTO_SETTINGS',
            callback: (event, key) => {
                event.preventDefault();
                $state.go('main.settings.general');
            }
        });

        Hotkey.addHotkey({
            combo: '/',
            description: 'HOTKEY.HK_FOCUS_ON_SEARCH',
            callback: (event, key) => {
                if($rootScope.isPopupState($state.current.name) === false){
                    event.preventDefault();
                    document.getElementById('top-search').focus();
                }
            }
        });

        Hotkey.addHotkey({
            combo: 'esc',
            description: 'HOTKEY.HK_LEAVE_FROM_SEARCH',
            callback: (event, key) => {
                if($rootScope.isPopupState($state.current.name) === false) {
                    event.preventDefault();
                    document.getElementById('top-search').blur();
                }
            },
            allowIn: ['INPUT']
        });
    };

    return Hotkey;
};