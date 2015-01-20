angular.module(primaryApplicationName).controller('CtrlDetails', function($scope, $state, user, signUp) {
	if (!signUp.tokenSignup || !signUp.plan)
		$state.go('invite');

	$scope.form = {
		firstName: '',
		lastName: '',
		displayName: ''
	};

	$scope.$watchGroup(['form.firstName', 'form.lastName'], () => {
		var firstName = $scope.form.firstName ? $scope.form.firstName.trim() : '';
		var lastName = $scope.form.lastName ? $scope.form.lastName.trim() : '';
		var autoDisplayName = `${firstName} ${lastName}`;

		$scope.form.displayName = firstName || lastName ? autoDisplayName : $scope.form.displayName;
	});

	$scope.requestDetailsUpdate = () => {
		signUp.details = $scope.form;

		$state.go('choosePasswordIntro');
	};
});
