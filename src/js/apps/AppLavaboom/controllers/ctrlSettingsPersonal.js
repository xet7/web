angular.module(primaryApplicationName).controller('CtrlSettingsPersonal',
	function($scope, $timeout, user) {
		$scope.name = user.name;
		$scope.status = '';
		$scope.settings = {};

		$scope.$bind('user-settings', () => {
			$scope.settings = user.settings;
			console.log('$scope.settings', $scope.settings);
		});

		var clearTimeout = null;
		$scope.$watch('status', () => {
			if ($scope.status) {
				clearTimeout = $timeout.schedule(clearTimeout, () => {
					$scope.status = '';
				}, 1000);
			}
		});

		var updateTimeout = null;
		$scope.$watch('settings', (o, n) => {
			if (o === n)
				return;

			if (Object.keys($scope.settings).length > 0) {
				updateTimeout = $timeout.schedule(updateTimeout, () => {
					user.update($scope.settings)
						.then(() => {
							$scope.status = 'saved!';
						})
						.catch(err => {
							$scope.status = 'ops...';
						});
				}, 1000);
			}
		}, true);
	});