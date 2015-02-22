module.exports = /*@ngInject*/($translate, hotkeys, user) => {
    var hotkey_list = ['?'];
    var previousKeys = [];

    var Hotkey = function() {

    };

    Hotkey.addHotkey = (option) => {
        if (angular.isUndefined(option))
            return;

        var key = angular.isArray(option.combo) ? option.combo[0] : option.combo;
        var current_key = hotkeys.get(key);
        console.log(option.combo);
        console.log(current_key);
        if (current_key)
            hotkeys.del(current_key);
        if (hotkey_list.indexOf(option.combo) == -1) {
            hotkey_list.push(option.combo);
        }

        option.description = $translate.instant(option.description);
        hotkeys.add(option);
    };

    Hotkey.toggleHotkeys = (enable) => {
        if (enable) {
            for (let hotkey of previousKeys) {
                if (hotkey)
                    hotkeys.add(hotkey);
            }
            previousKeys.length = 0;
        } else {
            for (let key of hotkey_list) {
                var hotkey = hotkeys.get(key);
                if (hotkey) {
                    previousKeys.push(hotkey);
                    hotkeys.del(hotkey);
                }
            }
        }
    };

    return Hotkey;
};