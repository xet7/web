angular.module('AppLavaboomLogin').controller('CtrlDetails', function($scope, $state, user) {
	$scope.form = {
		firstName: '',
		lastName: '',
		displayName: ''
	};

	$scope.$watchGroup(['form.firstName', 'form.lastName'], () => {
		$scope.form.displayName = $scope.form.firstName || $scope.form.lastName ? `${$scope.form.firstName} ${$scope.form.lastName}` : '';
	});

	$scope.setDetails = () => {
		user.signup.details = $scope.form;

		$state.go('choosePasswordIntro');
	};
});
