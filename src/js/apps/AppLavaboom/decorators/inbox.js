module.exports = /*@ngInject*/($delegate, $rootScope, $translate, co, consts, Cache) => {
	const self = $delegate;

	self.threads = {};
	self.threadsList = {};

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

	let threadsById = new Cache(DEFAULT_CACHE_OPTIONS);
	let threadsListByLabelName = new Cache(DEFAULT_CACHE_OPTIONS);

	proxyMethodCall('initialize', function *(initialize, args){
		yield initialize(...args);

		self.threads = {};
		self.threadsList = Object.keys(self.labelsByName).reduce((a, name) => {
			a[name] = [];
			return a;
		}, {});
	});

	proxyMethodCall('getLabels', function *(getLabels, args) {
		return yield getLabels(...args);
	});

	proxyMethodCall('requestList', function *(requestList, args) {
		const [labelName, offset, limit] = args;

		if (offset === 0)
			self.threadsList[labelName] = [];

		let res = threadsListByLabelName.get(labelName);
		if (!res)
			threadsListByLabelName.put(labelName, yield requestList(...args));
		res = threadsListByLabelName.get(labelName);

		self.threads = angular.extend(self.threads, res.map);
		self.threadsList[labelName] = _.uniq(self.threadsList[labelName].concat(res.list), t => t.id);

		$rootScope.$broadcast(`inbox-threads`);

		return res;
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