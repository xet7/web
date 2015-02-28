module.exports = /*@ngInject*/($delegate, $rootScope, $translate, co, consts, Cache) => {
	const self = this;

	/*
	wait for AWAIT_FOR_ITEM_CONCURRENT msec when Inbox.getThreadById called and there is pending Inbox.requestList
	if no update available invoke Inbox.getThreadById to pull the actual data
	 */
	//const AWAIT_FOR_ITEM_CONCURRENT = 500;

	const DEFAULT_CACHE_OPTIONS = {
		ttl: consts.INBOX_THREADS_CACHE_TTL
	};

	const proxyMethodCall = (call, proxy) => {
		const original = $delegate[call];
		$delegate[call] = (...args) => co(function *(){
			return yield co(proxy(original, args));
		});
	};

	const performThreadsOperation = (operation) => function *() {
		let r = yield co(operation);

		$rootScope.$broadcast(`inbox-threads`);

		return r;
	};

	const proxyThreadsMethodCall = (call, proxy) => {
		proxyMethodCall(call, performThreadsOperation(proxy));
	};

	let threadsById = new Cache(DEFAULT_CACHE_OPTIONS);
	let threadsListByLabelName = new Cache(DEFAULT_CACHE_OPTIONS);

	proxyMethodCall('getLabels', function *(getLabels, args) {
		return yield getLabels(...args);
	});

	proxyThreadsMethodCall('requestList', function *(requestList, args) {
		const [labelName, offset, limit] = args;

		let res = threadsListByLabelName.get(labelName);
		if (!res)
			threadsListByLabelName.put(labelName, yield requestList(...args));

		return threadsListByLabelName.get(labelName);
	});

	$delegate.invalidateThreadCache = () => {
	};

	$delegate.invalidateEmailCache = () => {
	};

	$rootScope.whenInitialized(() => {
		$rootScope.$on('logout', () => {
			self.invalidateEmailCache();
			self.invalidateThreadCache();
		});
	});

	return $delegate;
};