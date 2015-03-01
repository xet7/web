module.exports = /*@ngInject*/(co) => {
	const Proxy = function ($delegate) {
		const self = this;

		this.unbindedMethodCall = (call, proxy) => {
			const cache = {};

			const original = $delegate[call];

			// we don't want to have multiple simultaneous calls to the same resource(call + arguments)
			// so basically if we have one pending we always wait for it to return instead of making a new one
			const originalCachingWrapper = (...args) => co(function *(){
				const key = call + '.' + args.join(':');
				console.log('calling original, cache key', key);

				if (!cache[key])
					cache[key] = original(...args);

				const promise = cache[key];
				try {
					return yield promise;
				} finally {
					delete cache[key];
				}
			});

			return  (...args) => co(function *(){
				return yield co(proxy(originalCachingWrapper, args));
			});
		};

		this.methodCall = (call, proxy) => {
			$delegate[call] = self.unbindedMethodCall(call, proxy);
		};
	};

	return Proxy;
};