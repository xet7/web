module.exports = /*@ngInject*/($delegate, $rootScope, co, consts, Cache, Proxy) => {
	const self = $delegate;

	const proxy = new Proxy($delegate);
	const cache = new Cache('crypto cache', {
		ttl: consts.CRYPTO_CACHE_TTL
	});

	proxy.methodCall('decodeRaw', function *(decodeRaw, args) {
		const [message] = args;

		if (message.length < consts.CRYPTO_CACHE_MAX_ENTRY_SIZE) {
			const key = openpgp.crypto.hash.md5(message);

			let value = cache.get(key);
			if (!value) {
				value = yield decodeRaw(...args);
				cache.put(key, value);
			}

			return value;
		}

		return yield decodeRaw(...args);
	});

	$delegate.invalidateCryptoCache = () => {
		cache.invalidateAll();
	};

	$rootScope.whenInitialized(() => {
		$rootScope.$on('keyring-updated', () => {
			self.invalidateCryptoCache();
		});
		$rootScope.$on('logout', () => {
			self.invalidateCryptoCache();
		});
	});

	return $delegate;
};