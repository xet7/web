module.exports = function($rootScope, $translate, $timeout) {
	const self = this;

	let notifications = {};

	this.clear = () => {
		notifications = {};
		$rootScope.$broadcast('notifications');
	};

	this.set = (name, {text, title, type, timeout, namespace, kind, onRemove}) => {
		if (!type)
			type = 'warning';
		if (!namespace)
			namespace = 'root';
		if (!kind)
			kind = 'unspecified';
		if (!title)
			title = '';
		if (!timeout)
			timeout = 0;
		if (!onRemove)
			onRemove = null;

		let cssClass = '';
		if (type == 'warning')
			cssClass = 'icon-info-circle';

		const notification = {
			text,
			title,
			type,
			timeout,
			namespace,
			kind,
			cssClass,
			onRemove
		};
		notifications[namespace + '.' + name] = notification;

		if (timeout > 0)
			$timeout(() => {
				self.unSet(name, namespace);
			}, timeout);

		$rootScope.$broadcast('notifications');
	};

	this.unSet = (name, namespace = 'root') => {
		name = namespace + '.' + name;
		if (name in notifications) {
			if (notifications[name].onRemove)
				notifications[name].onRemove();
			delete notifications[name];
			$rootScope.$broadcast('notifications');
		}
	};

	this.unSetByKind = (kind) => {
		for(let cName of Object.keys(notifications))
			if (notifications[cName].kind == kind) {
				if (notifications[cName].onRemove)
					notifications[cName].onRemove();
				delete notifications[cName];
			}

		$rootScope.$broadcast('notifications');
	};

	this.get = (type, namespace = 'root') => {
		const notificationsSet = angular.copy(notifications);
		let r =  Object.keys(notificationsSet).reduce((a, name) => {
			if (!name.startsWith(namespace + '.'))
				return a;

			if (notificationsSet[name].type == type)
				a[name.replace(namespace + '.', '')] = notificationsSet[name];

			return a;
		}, {});

		if (namespace != 'root')
			angular.extend(r, self.get(type));

		return r;
	};
};