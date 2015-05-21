module.exports = ($scope, $modalInstance) => {
	$scope.no = function(){
		$modalInstance.dismiss('no');
	};

	$scope.yes = function(){
		$modalInstance.close('yes');
	};
};