angular.module(primaryApplicationName).controller('CtrlAuth',
	function($scope, $rootScope, $window, $interval, co, user, loader) {
		$scope.form = {
			username: '',
			password: '',
			isRemember: true,
			isPrivateComputer: true
		};

		$scope.logIn = () => co(function *(){
			yield user.signIn($scope.form.username, $scope.form.password, $scope.form.isRemember, $scope.form.isPrivateComputer);

			loader.resetProgress();
			loader.showLoader(true);
			loader.loadMainApplication();
		});
	});