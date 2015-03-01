module.exports = /*@ngInject*/(co) => {
	const Proxy = function ($delegate) {
		this.methodCall = (call, proxy) => {
			const original = $delegate[call];
			$delegate[call] = (...args) => co(function *(){
				return yield co(proxy(original, args));
			});
		};
	};

	return Proxy;
};