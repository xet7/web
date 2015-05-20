module.exports = /*@ngInject*/($scope) => {
	$scope.status = {
		isDropdownOpened: false
	};
	$scope.switchContextMenu = () => {
		$scope.status.isDropdownOpened = !$scope.status.isDropdownOpened;
	};
};