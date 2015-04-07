module.exports = /*@ngInject*/($rootScope, $translate, $injector, translate) => {
	$rootScope.$bind = (bindName, bindHandler) => {
		let r = $rootScope.$on(bindName, bindHandler);

		bindHandler();

		return r;
	};

	$rootScope.switchLanguage = (langKey) => {
		translate.switchLanguage(langKey);
	};

	$rootScope.isInitialized = false;
	$rootScope.isShown = false;
	$rootScope.currentErrorMessage = '';

	$rootScope.$on('$stateChangeSuccess', () => {
		$rootScope.currentErrorMessage = '';
	});

	$rootScope.shownApplication = () => {
		$rootScope.isShown = true;
	};

	$rootScope.notificationsInfo = $rootScope.notificationsWarning = {};
	const initializeNotifications = () => {
		const notifications = $injector.get('notifications');

		$rootScope.$bind('notifications', () => {
			$rootScope.notificationsInfo = notifications.get('info');
			$rootScope.notificationsWarning = notifications.get('warning');
		});

		$rootScope.unSetNotification = (nid, namespace) => {
			notifications.unSet(nid, namespace);
		};

		$rootScope.getNotificationsLength = (...notifications) =>
			notifications.reduce((a, c) => a + (c ? Object.keys(c).length : 0), 0);
	};

	$rootScope.whenInitialized = (initializer) => {
		console.log('whenInitialized', $rootScope.isInitialized);
		if ($rootScope.isInitialized) {
			initializeNotifications();
			initializer();
		} else
			$rootScope.$on('initialization-completed', () => {
				initializeNotifications();
				initializer();
			});
	};
};