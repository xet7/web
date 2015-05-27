module.exports = ($scope, hotkey) => {
	let hotkeys = hotkey.getKeys();

	$scope.globalHotkeys = hotkeys.filter(h => h.isGlobal);
	$scope.localHotkeys = hotkeys.filter(h => !h.isGlobal);
};
