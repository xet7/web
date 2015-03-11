module.exports = /*@ngInject*/($scope, hotkey) => {
	$scope.hotkeys = hotkey.getKeys();
	console.log('$scope.hotkeys', $scope.hotkeys);
};
