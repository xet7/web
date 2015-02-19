module.exports = /*@ngInject*/(hotkeys, user) => {
    var hotkey_list = ['?', '/', 'esc', 'h', 'k', 'left', 'up', 'j', 'l', 'right', 'down', 'c+n', 'ctrl+enter', 'command+enter', 'i', 'a', 'd', 'r'];
    var previousKeys = [];

    var Hotkey = function() {

    };

    Hotkey.toggleHotkeys = (enable) => {
        if (enable) {
            for (let hotkey of previousKeys) {
                hotkeys.add(hotkey);
            }
            previousKeys.length = 0;
        } else {
            for (let key of hotkey_list) {
                var hotkey = hotkeys.get(key);
                previousKeys.push(hotkey);
                hotkeys.del(hotkey);
            }
        }
    };

    return Hotkey;
};