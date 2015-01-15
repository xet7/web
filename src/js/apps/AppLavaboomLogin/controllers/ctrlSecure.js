angular.module('AppLavaboomLogin').controller('CtrlSecure', function($scope, $state, user) {
	$scope.form = {
		username: '',
		email: '',
		isNews: true
	};
	$scope.isProcessing = false;

	$scope.secure = () => {
		$scope.isProcessing = true;
		user.reserve($scope.form.username, $scope.form.email)
			.then(() => {
				$state.go('reservedUsername');
			})
			.finally(() => {
				$scope.isProcessing = false;
			});
	};
});