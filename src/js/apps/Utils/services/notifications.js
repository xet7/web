module.exports = /*@ngInject*/function($rootScope, $translate) {
	const translations = {
		WEB_CRYPTO_IS_NOT_AVAILABLE_TITLE:'',
		WEB_CRYPTO_IS_NOT_AVAILABLE_TEXT:'',
		WEB_WORKERS_IS_NOT_AVAILABLE_TITLE:'',
		WEB_WORKERS_IS_NOT_AVAILABLE_TEXT:''
	};

	$translate.bindAsObject(translations, 'NOTIFICATIONS');

	let notifications = {};

	this.clear = () => {
		notifications = {};
		$rootScope.$broadcast('notifications');
	};

	this.set = (name, {text, title, type, namespace}) => {
		if (!type)
			type = 'warning';
		if (!namespace)
			namespace = 'root';
		if (!title)
			title = '';

		let cssClass = '';
		if (type == 'warning')
			cssClass = 'icon-info-circle';

		notifications[namespace + '.' + name] = {
			text,
			title,
			type,
			namespace,
			cssClass
		};
		$rootScope.$broadcast('notifications');
	};

	this.unSet = (name, namespace = 'root') => {
		name = namespace + '.' + name;
		if (name in notifications) {
			delete notifications[name];
			$rootScope.$broadcast('notifications');
		}
	};

	this.get = (type, namespace = 'root') => {
		const notificationsSet = angular.copy(notifications);
		return Object.keys(notificationsSet).reduce((a, name) => {
			if (!name.startsWith(namespace + '.'))
				return a;

			if (notificationsSet[name].type == type)
				a[name] = notificationsSet[name];

			return a;
		}, {});
	};
};