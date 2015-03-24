module.exports = /*@ngInject*/function($rootScope, $translate, co, notifications) {
	const self = this;

	const notifications18n = {
		WEB_CRYPTO_IS_NOT_AVAILABLE_TITLE: '',
		WEB_CRYPTO_IS_NOT_AVAILABLE_TEXT: '',
		WEB_WORKERS_IS_NOT_AVAILABLE_TITLE: '',
		WEB_WORKERS_IS_NOT_AVAILABLE_TEXT: '',
		WEB_CRYPTO_LIMITED_TITLE: '',
		WEB_CRYPTO_LIMITED_TEXT: ''
	};

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
};