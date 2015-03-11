module.exports = /*@ngInject*/($scope, hotkey) => {
	$scope.hotkeys = hotkey.getKeys();
};
