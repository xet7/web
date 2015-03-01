module.exports = /*@ngInject*/($delegate, $rootScope, $translate, co, consts, Cache, Proxy) => {
	const self = $delegate;

	const proxy = new Proxy($delegate);

	self.threads = {};
	self.threadsList = {};

	/*
	wait for AWAIT_FOR_ITEM_CONCURRENT msec when Inbox.getThreadById called and there is pending Inbox.requestList
	if no update available invoke Inbox.getThreadById to pull the actual data
	 */
	const AWAIT_FOR_ITEM_CONCURRENT = 500;
	let pendingListRequest = null;

	const CACHE_UNFOLD = {
		unfold: item => item.id
	};

	let cache = new Cache('default cache', {
		ttl: consts.INBOX_LABELS_CACHE_TTL
	});
	let threadsCache = new Cache('threads cache', angular.extend({},
		{
			ttl: consts.INBOX_THREADS_CACHE_TTL
		},
		CACHE_UNFOLD
	));
	let emailsCache = new Cache('emails cache', angular.extend({},
		{
			ttl: consts.INBOX_EMAILS_CACHE_TTL
		},
		CACHE_UNFOLD
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

	proxy.methodCall('initialize', function *(initialize, args){
		const res = yield initialize(...args);
		return res;
	});

	proxy.methodCall('createLabel', function *(createLabel, args) {
		const res = yield createLabel(...args);
		cache.invalidate('labels');

		return yield self.getLabels();
	});

	proxy.methodCall('getLabels', function *(getLabels, args) {
		let res = cache.get('labels');
		if (res)
			return res;

		res = yield getLabels(...args);
		cache.put('labels', res);

		return res;
	});

	proxy.methodCall('requestList', function *(requestList, args) {
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
			map: _.uniq(threadsCache.exposeIds(), t => t.id)
		});

		return res;
	});

	proxy.methodCall('getThreadById', function *(getThreadById, args) {
		const [threadId] = args;

		/*if (pendingListRequest)
			yield co.timeout(pendingListRequest, AWAIT_FOR_ITEM_CONCURRENT, null);*/

		const r = threadsCache.getById(threadId);
		if (r)
			return r;

		const thread = yield getThreadById(...args);
		const labels = yield self.getLabels();

		yield thread.labels.map(labelId => {
			const labelName = labels.byId[labelId].name;
			threadsCache.invalidate(labelName);

			return self.requestList(labelName, 0, self.limit);
		});

		return thread;
	});

	const requestModifyLabelproxy = function *(requestModifyLabel, args){
		const [thread] = args;

		const labels = yield self.getLabels();
		const newLabels = yield requestModifyLabel(...args);
		const setLabels = new Set([...thread.labels.map(labelId => labels.byId[labelId].name), ...newLabels.map(labelId => labels.byId[labelId].name)]);
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

	proxy.methodCall('requestDeleteForcefully', function *(requestDeleteForcefully, args) {
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

	proxy.methodCall('requestSetLabel', requestModifyLabelproxy);

	proxy.methodCall('requestRemoveLabel', requestModifyLabelproxy);

	proxy.methodCall('requestAddLabel', requestModifyLabelproxy);

	proxy.methodCall('setThreadReadStatus', function *(setThreadReadStatus, args){
		const [threadId] = args;

		const thread = threadsCache.getById(threadId);
		if (thread.isRead)
			return;

		yield setThreadReadStatus(...args);

		thread.isRead = true;

		cache.invalidate('labels');
		yield self.getLabels();
	});

	proxy.methodCall('getEmailsByThreadId', function *(getEmailsByThreadId, args) {
		const [threadId] = args;

		if (!emailsCache.get(threadId))
			emailsCache.put(threadId, yield getEmailsByThreadId(...args));

		return emailsCache.get(threadId);
	});

	proxy.methodCall('getEmailById', function *(getEmailById, args) {
		const [emailId] = args;

		let email = emailsCache.getById(emailId);
		if (!email)
			email = yield getEmailById(...args);

		return email;
	});

	proxy.methodCall('__handleEvent', function *(__handleEvent, args) {
		cache.invalidate('labels');

		yield __handleEvent(...args);
	});

	$delegate.invalidateThreadCache = () => {
		threadsCache.invalidateAll();
	};

	$delegate.invalidateEmailCache = () => {
		emailsCache.invalidateAll();
	};

	$rootScope.whenInitialized(() => {
		$rootScope.$on('logout', () => {
			self.invalidateEmailCache();
			self.invalidateThreadCache();
		});
	});

	return $delegate;
};