module.exports = /*@ngInject*/($delegate, $rootScope, $translate, co, consts, Cache) => {
	const self = $delegate;

	self.threads = {};
	self.threadsList = {};

	/*
	wait for AWAIT_FOR_ITEM_CONCURRENT msec when Inbox.getThreadById called and there is pending Inbox.requestList
	if no update available invoke Inbox.getThreadById to pull the actual data
	 */
	const AWAIT_FOR_ITEM_CONCURRENT = 500;
	let pendingListRequest = null;

	const DEFAULT_CACHE_OPTIONS = {
		ttl: consts.INBOX_THREADS_CACHE_TTL
	};

	const proxyMethodCall = (call, proxy) => {
		const original = $delegate[call];
		$delegate[call] = (...args) => co(function *(){
			return yield co(proxy(original, args));
		});
	};

	let cache = new Cache('default cache', DEFAULT_CACHE_OPTIONS);
	let threadsCache = new Cache('threads cache', angular.extend({},
		DEFAULT_CACHE_OPTIONS,
		{
			unfold: item => item.id
		}
	));

	const updateThreadLabelsById = (thread, labelsById, newLabels) => co(function *(){
		// remove labels that do not exist in updated thread
		thread.labels.forEach(lid => {
			if (newLabels.includes(lid))
				return;

			const labelName = labelsById[lid].name;

			const threads = threadsCache.get(labelName);
			if (threads) {
				const index = threads.findIndex(thread => thread.id == thread.id);
				if (index > -1)
					threads.splice(index, 1);
			}
		});

		// add new labels
		newLabels.forEach(lid => {
			if (thread.labels.includes(lid))
				return;

			const labelName = labelsById[lid].name;

			const threads = threadsCache.get(labelName);
			if (threads)
				threads.push(thread);
		});

		thread.labels = newLabels;
	});

	proxyMethodCall('initialize', function *(initialize, args){
		const res = yield initialize(...args);
		return res;
	});

	proxyMethodCall('getLabels', function *(getLabels, args) {
		let res = cache.get('labels');
		if (res)
			return res;

		res = yield getLabels(...args);
		cache.put('labels', res);

		return res;
	});

	proxyMethodCall('requestList', function *(requestList, args) {
		const [labelName, offset, limit] = args;

		console.log('requestList proxy:', labelName, offset, limit);
		let res = threadsCache.getTagged(labelName, [offset, limit]);
		console.log('requestList proxy: cache value', res);
		if (!res) {
			const newList = yield co(function *(){
				pendingListRequest = requestList(...args);
				const res = yield pendingListRequest;
				pendingListRequest = null;
				return res;
			});

			threadsCache.putTagged(labelName, [offset, limit], newList);
			const list = threadsCache.get(labelName);
			threadsCache.put(labelName, list ? _.uniq(list.concat(newList), t => t.id) : newList);
		}

		res = threadsCache.getTagged(labelName, [offset, limit]);

		$rootScope.$broadcast(`inbox-threads`, {
			labelName,
			list: threadsCache.exposeKeys(labelName),
			map: threadsCache.exposeIds()
		});

		return res;
	});

	proxyMethodCall('getThreadById', function *(getThreadById, args) {
		const [threadId] = args;

		/*if (pendingListRequest)
			yield co.timeout(pendingListRequest, AWAIT_FOR_ITEM_CONCURRENT, null);*/

		const r = threadsCache.getById(threadId);
		if (r)
			return r;

		return yield getThreadById(...args);
	});

	const requestModifyLabelProxy = function *(requestModifyLabel, args){
		const [thread] = args;

		const newLabels = yield requestModifyLabel(...args);
		const setLabels = new Set([...thread.labels.map(labelId => self.labelsById[labelId].name), ...newLabels.map(labelId => self.labelsById[labelId].name)]);
		const allLabels = [...setLabels.values()];

		// update cache if any
		const oldThread = threadsCache.getById(thread.id);
		if (oldThread) {
			const labelsRes = yield self.getLabels();

			yield updateThreadLabelsById(oldThread, labelsRes.byId, newLabels);
		}

		for(let labelName of allLabels) {
			console.log('requestModifyLabel proxy label update: ', labelName);

			const list = threadsCache.exposeKeys(labelName);
			if (list)
				$rootScope.$broadcast(`inbox-threads`, {
					labelName,
					list: list,
					map: threadsCache.exposeIds()
				});
		}

		return newLabels;
	};

	proxyMethodCall('requestDeleteForcefully', function *(requestDeleteForcefully, args) {
		const res = yield requestDeleteForcefully(...args);

		const [thread] = args;

		threadsCache.removeById(thread.id);

		const labelsRes = yield self.getLabels();

		thread.labels.forEach(labelId => {
			const labelName = labelsRes.byId[labelId].name;

			console.log('requestDeleteForcefully broadcast inbox-threads for', labelName);
			$rootScope.$broadcast(`inbox-threads`, {
				labelName,
				list: threadsCache.exposeKeys(labelName),
				map: threadsCache.exposeIds()
			});
		});

		return res;
	});

	proxyMethodCall('requestSetLabel', requestModifyLabelProxy);

	proxyMethodCall('requestRemoveLabel', requestModifyLabelProxy);

	proxyMethodCall('requestAddLabel', requestModifyLabelProxy);

	proxyMethodCall('setThreadReadStatus', function *(setThreadReadStatus, args){
		const [threadId] = args;

		const thread = threadsCache.getById(threadId);
		if (thread.isRead)
			return;

		yield setThreadReadStatus(...args);

		thread.isRead = true;
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