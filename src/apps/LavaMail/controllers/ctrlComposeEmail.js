module.exports = ($scope) => {
	$scope.status = {
		isDropdownOpened: false
	};
	$scope.switchContextMenu = () => {
		$scope.status.isDropdownOpened = !$scope.status.isDropdownOpened;
	};
};