module.exports = /*@ngInject*/($scope, $timeout, user) => {
	$scope.name = user.name;
	$scope.status = '';
	$scope.settings = {};

	$scope.$bind('user-settings', () => {
		$scope.settings = user.settings;
	});

	const timeouts = {
		clear: null,
		update: null
	};

	$scope.$watch('status', () => {
		if ($scope.status) {
			timeouts.clear = $timeout.schedule(timeouts.clear, () => {
				$scope.status = '';
			}, 1000);
		}
	});

	$scope.$watch('settings', (o, n) => {
		if (o === n)
			return;

		if (Object.keys($scope.settings).length > 0) {
			timeouts.update = $timeout.schedule(timeouts.update, () => {
				user.update($scope.settings)
					.then(() => {
						$scope.status = 'saved!';
					})
					.catch(() => {
						$scope.status = 'ops...';
					});
			}, 1000);
		}
	}, true);
};