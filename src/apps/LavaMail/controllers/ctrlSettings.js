module.exports = ($rootScope, $scope, notifications) => {
	$rootScope.$bind('notifications', () => {
		$scope.notificationsInfo = notifications.get('info', 'settings');
		$scope.notificationsWarning = notifications.get('warning', 'settings');
	});
};