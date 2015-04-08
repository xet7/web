module.exports = /*@ngInject*/function($rootScope, $translate) {
	const translations = {
		'WEB_CRYPTO_IS_NOT_AVAILABLE_TITLE':'',
		'WEB_CRYPTO_IS_NOT_AVAILABLE_TEXT':'',
		'WEB_WORKERS_IS_NOT_AVAILABLE_TITLE':'',
		'WEB_WORKERS_IS_NOT_AVAILABLE_TEXT':''
	};

	$translate.bindAsObject(translations, 'NOTIFICATIONS');

	let notifications = {};

	this.clear = () => {
		notifications = {};
		$rootScope.$broadcast('notifications');
	};

	this.set = (name, {text, title, type}) => {
		if (!type)
			type = 'warning';

		let cssClass = '';
		if (type == 'warning')
			cssClass = 'icon-info-circle';

		notifications[name] = {
			text,
			title,
			type,
			cssClass
		};
		$rootScope.$broadcast('notifications');
	};

	this.unSet = (name) => {
		if (name in notifications) {
			delete notifications[name];
			$rootScope.$broadcast('notifications');
		}
	};

	this.get = () => {
		return angular.copy(notifications);
	};
};