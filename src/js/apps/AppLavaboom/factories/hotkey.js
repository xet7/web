module.exports = /*@ngInject*/($translate, hotkeys) => {
    var hotkeyList = ['?'];
    var previousKeys = [];

    var Hotkey = function() {

    };

    Hotkey.addHotkey = (option) => {
        if (angular.isUndefined(option))
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
        if (enable) {
            for (let hotkey of previousKeys) {
                if (hotkey)
                    hotkeys.add(hotkey);
            }
            previousKeys.length = 0;
        } else {
            for (let key of hotkeyList) {
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