const fs = require('fs');
window.coJS = require('co');

module.exports = /*@ngInject*/($rootScope, $translate, $injector, translate, consts) => {
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
	$rootScope.manifest = JSON.parse(consts.stripBOM(
		fs.readFileSync(__dirname + '/../../../../manifest.json', 'utf8')
	));
	$rootScope.servedBy = {
		text: '',
		title: ''
	};

	const initializeNotifications = () => {
		const notifications = $injector.get('notifications');

		$rootScope.servedBy = notifications.get('info', 'status')['powered-by']
			|| notifications.get('warning', 'status')['powered-by'];

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