module.exports = ($delegate, $rootScope, co, consts, Cache, Proxy) => {
	const self = $delegate;

	const proxy = new Proxy($delegate);

	return $delegate;
};