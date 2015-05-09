module.exports = /*@ngInject*/($scope, $modalInstance) => {
	$scope.no = function(){
		$modalInstance.dismiss('no');
	};

	$scope.yes = function(){
		$modalInstance.close('yes');
	};
};