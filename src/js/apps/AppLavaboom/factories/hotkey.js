module.exports = /*@ngInject*/(hotkeys) => {
    var hotkey_list = ['?', '/'];
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