module.exports = /*@ngInject*/function($rootScope, $timeout, $state, $translate, $http, co, notifications, crypto, user) {
	const self = this;

	const notifications18n = {
		WEB_CRYPTO_IS_NOT_AVAILABLE_TITLE: '',
		WEB_CRYPTO_IS_NOT_AVAILABLE_TEXT: '',
		WEB_WORKERS_IS_NOT_AVAILABLE_TITLE: '',
		WEB_WORKERS_IS_NOT_AVAILABLE_TEXT: '',
		WEB_CRYPTO_LIMITED_TITLE: '',
		WEB_CRYPTO_LIMITED_TEXT: '',
		SERVED_BY_TITLE: '%',
		SERVED_BY_TEXT: '%',
		SERVED_BY_UNKNOWN_TITLE: '',
		SERVED_BY_UNKNOWN_TEXT: '',
		NO_KEY_TITLE: '',
		NO_KEY_TEXT: ''
	};

	let poweredBy = '';

	this.initialize = () => co(function *(){
		yield $translate.bindAsObject(notifications18n, 'NOTIFICATIONS');
	});

	this.performCompatibilityChecks = () => co(function *(){
		if (!self.isWebWorkers())
			notifications.set('web-workers', {
				title: notifications18n.WEB_WORKERS_IS_NOT_AVAILABLE_TITLE,
				text: notifications18n.WEB_WORKERS_IS_NOT_AVAILABLE_TEXT
			});

		if (!self.isWebCrypto())
			notifications.set('web-crypto', {
				title: notifications18n.WEB_CRYPTO_IS_NOT_AVAILABLE_TITLE,
				text: notifications18n.WEB_CRYPTO_IS_NOT_AVAILABLE_TEXT
			});

		const isWebCryptoKeysGeneration = yield self.isWebCryptoKeysGeneration();
		if (!isWebCryptoKeysGeneration)
			notifications.set('web-crypto-limited', {
				title: notifications18n.WEB_CRYPTO_LIMITED_TITLE,
				text: notifications18n.WEB_CRYPTO_LIMITED_TEXT
			});

		const headRes = yield $http.head('/');
		poweredBy = headRes.headers('X-Powered-By');

		if (poweredBy) {
			notifications.set('powered-by', {
				title: notifications18n.SERVED_BY_TITLE({servedBy: poweredBy}),
				text: notifications18n.SERVED_BY_TEXT({servedBy: poweredBy}),
				namespace: 'status',
				type: 'info'
			});
		} else {
			notifications.set('powered-by', {
				title: notifications18n.SERVED_BY_UNKNOWN_TITLE,
				text: notifications18n.SERVED_BY_UNKNOWN_TEXT,
				namespace: 'status',
				type: 'warning'
			});
			notifications.set('powered-by', {
				title: notifications18n.SERVED_BY_UNKNOWN_TITLE,
				text: notifications18n.SERVED_BY_UNKNOWN_TEXT,
				type: 'warning'
			});
		}

		let list = crypto.getAvailablePrivateKeysForEmail(user.email);
		if (list.keys.length < 1 || list.keys.every(k => !k.primaryKey.isDecrypted))
			notifications.set('no-key', {
				title: notifications18n.NO_KEY_TITLE,
				text: notifications18n.NO_KEY_TEXT,
				type: 'warning',
				onRemove: () => {
					$state.go('main.settings.security');
				}
			});
	});

	this.isWebCrypto = () => {
		return !!window.crypto || !!window.msCrypto;
	};

	this.isWebWorkers = () => co(function *(){
		return !!window.Worker;
	});

	this.isWebCryptoKeysGeneration = () => co(function *(){
		try {
			const r = yield openpgp.key.generate({numBits: 1024, userId: 'test@test', passphrase: 'test'});

			return true;
		} catch (err) {
			return false;
		}
	});

	this.getPoweredBy = () => poweredBy;
};