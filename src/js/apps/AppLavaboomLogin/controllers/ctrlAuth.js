angular.module(primaryApplicationName).controller('CtrlAuth', function($scope, $rootScope, $window, $interval, user, loader) {
    $scope.form = {
		username: '',
		password: '',
		isRemember: true,
		isPrivateComputer: true
	};
	$scope.isProcessing = false;

    $scope.logIn = () => {
		$scope.isProcessing = true;
		user.signIn($scope.form.username, $scope.form.password, $scope.form.isRemember, $scope.form.isPrivateComputer)
			.then(() => {
				/*angular.module(primaryApplicationName).config(function($stateProvider){
					$stateProvider.state('empty', {
						url: '/'
					})
						.state('main', {
							abstract: true
						})
						.state('main.label', {
							url: '/label/:labelName'
						})
						.state('main.settings', {
							url: '/settings'
						})
						.state('main.compose', {
							url: '/compose'
						})
						.state('main.settings.preferences', {
							url: '/preferences'
						})
						.state('main.settings.profile', {
							url: '/profile'
						})
						.state('main.settings.security', {
							url: '/security'
						})
						.state('main.settings.plan', {
							url: '/plan'
						});
					console.log('blank configuration added');

					loader.resetProgress();
					loader.showLoader(true);
					loader.loadMainApplication();
				});*/
				$window.location = '/';
			})
			.finally(() => {
				$scope.isProcessing = false;
			});
	};
});
