module.exports = /*@ngInject*/($scope, $timeout, user, co) => {
	$scope.name = user.styledName;
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
			timeouts.update = $timeout.schedulePromise(timeouts.update, () => co(function *(){
				try {
					yield user.update($scope.settings);
					$scope.status = 'saved!';
				} catch (err) {
					$scope.status = 'ops...';
				}
			}), 1000);
		}
	}, true);
};