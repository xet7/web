module.exports = /*@ngInject*/($scope, Hotkey) => {
	$scope.hotkeys = Hotkey.getKeys();
};
