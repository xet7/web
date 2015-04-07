module.exports = /*@ngInject*/($scope, $timeout, $translate, user, co, notifications) => {
	$scope.name = user.styledName;
	$scope.status = '';
	$scope.settings = {};

	const translations = {
		LB_PROFILE_SAVED: '',
		LB_PROFILE_CANNOT_BE_SAVED: ''
	};
	$translate.bindAsObject(translations, 'MAIN.SETTINGS.PROFILE');

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

					notifications.set('profile-save-ok', {
						text: translations.LB_PROFILE_SAVED,
						type: 'info',
						timeout: 3000,
						namespace: 'settings'
					});
				} catch (err) {
					notifications.set('profile-save-fail', {
						text: translations.LB_PROFILE_CANNOT_BE_SAVED,
						namespace: 'settings'
					});
				}
			}), 1000);
		}
	}, true);
};