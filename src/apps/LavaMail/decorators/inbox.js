module.exports = ($delegate, $rootScope, $translate, co, consts, utils, LavaboomAPI, Cache, Proxy) => {
	const self = $delegate;

	const proxy = new Proxy($delegate);

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
		{
			list: value => value.list
		},
		CACHE_UNFOLD
	));
	let emailsCache = new Cache('emails cache', angular.extend({},
		{
			ttl: consts.INBOX_EMAILS_CACHE_TTL
		},
		CACHE_UNFOLD
	));

	const requestModifyLabelProxy = function *(requestModifyLabel, args){
		const [thread] = args;

		const labels = yield self.getLabels();
		const newLabels = yield requestModifyLabel(...args);
		const allLabels = utils.uniq([...thread.labels.map(labelId => labels.byId[labelId].name), ...newLabels.map(labelId => labels.byId[labelId].name)]);

		allLabels.forEach(labelName => {
			threadsCache.invalidate(labelName);
		});

		for(let labelName of allLabels) {
			console.log('requestModifyLabel proxy label update: ', labelName);

			$rootScope.$broadcast(`inbox-threads`, labelName);
		}

		return newLabels;
	};

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
	}, true);

	const requestListProxy = function *(requestList, args) {
		let [labelName, offset, limit] = args;

		console.log('proxy requestList', labelName, offset, limit);

		let value = threadsCache.get(labelName);
		if (!value || (!value.isEnd && offset >= value.list.length)) {
			let newList = yield requestList(...args);
			if (!newList)
				newList = [];

			threadsCache.put(labelName, {
				list: value && value.list ? utils.uniq(value.list.concat(newList), c => c.id) : newList,
				isEnd: newList.length < limit
			});
		}

		value = threadsCache.get(labelName);
		console.log('requestList cache value is', value);

		return value;
	};

	proxy.methodCall('requestList', function *(requestList, args) {
		let [labelName, offset, limit] = args;

		const value = yield requestListProxy(requestList, args);

		$rootScope.$broadcast(`inbox-threads`, labelName);

		return value.list.slice(offset, offset + limit);
	}, true);

	self.requestListDirect = proxy.unbindedMethodCall('requestList', function *(requestList, args) {
		let [labelName, offset, limit] = args;

		const value = yield requestListProxy(requestList, args);

		$rootScope.$broadcast(`inbox-threads-ready`, labelName, value.list);

		return value.list;
	}, true);

	self.requestListCached = (labelName) => {
		const value = threadsCache.get(labelName);

		return value ? value.list : [];
	};

	proxy.methodCall('getThreadById', function *(getThreadById, args) {
		const [threadId, isCachedOnly] = args;

		const r = threadsCache.getById(threadId);
		if (r)
			return r;

		if (isCachedOnly)
			return null;

		const thread = yield getThreadById(...args);

		const labels = yield self.getLabels();

		thread.labels.forEach(labelId => {
			const labelName = labels.byId[labelId].name;
			threadsCache.unshiftOnlyIfKeyIsPreset(labelName, thread);

			$rootScope.$broadcast(`inbox-threads`, labelName);
		});

		return thread;
	}, true);

	proxy.methodCall('requestDeleteForcefully', function *(requestDeleteForcefully, args) {
		const res = yield requestDeleteForcefully(...args);

		const [thread] = args;

		const labelsRes = yield self.getLabels();

		thread.labels.forEach(labelId => {
			const labelName = labelsRes.byId[labelId].name;
			threadsCache.invalidate(labelName);
			$rootScope.$broadcast(`inbox-threads`, labelName);
		});

		return res;
	});

	proxy.methodCall('requestSetLabel', requestModifyLabelProxy);

	proxy.methodCall('requestRemoveLabel', requestModifyLabelProxy);

	proxy.methodCall('requestAddLabel', requestModifyLabelProxy);

	proxy.methodCall('setThreadReadStatus', function *(setThreadReadStatus, args){
		const [threadId] = args;

		const thread = threadsCache.getById(threadId);

		if (thread) {
			const labels = yield self.getLabels();
			thread.labels.forEach(lid => {
				const labelName = labels.byId[lid].name;
				console.log('setThreadReadStatus decorator for threadId', threadId, 'labelName', labelName);
				if (['Inbox'].includes(labelName))
					labels.byName[labelName].addReadThreadId(threadId);
			});

			$rootScope.$broadcast('inbox-labels', labels);
		}

		if (thread && thread.isRead)
			return;

		yield setThreadReadStatus(...args);

		if (thread)
			thread.isRead = true;

		cache.invalidate('labels');
		yield self.getLabels();
	});

	proxy.methodCall('getEmailsByThreadId', function *(getEmailsByThreadId, args) {
		const [threadId] = args;

		if (!emailsCache.get(threadId))
			emailsCache.put(threadId, yield getEmailsByThreadId(...args));

		return emailsCache.get(threadId);
	}, true);

	proxy.methodCall('getEmailById', function *(getEmailById, args) {
		const [emailId] = args;

		let email = emailsCache.getById(emailId);
		if (!email)
			email = yield getEmailById(...args);

		return email;
	}, true);

	proxy.methodSyncCall('setSortQuery', function (setSortQuery, args) {
		self.invalidateThreadCache();
		return setSortQuery(...args);
	});

	$delegate.invalidateThreadCache = () => {
		threadsCache.invalidateAll();
	};

	$delegate.invalidateEmailCache = () => {
		emailsCache.invalidateAll();
	};

	const events = [];

	const handleEvent = (event) => co(function *(){
		console.log('got server event', event);

		const labels = cache.get('labels');

		if (labels) {
			const labelNames = event.labels.map(lid => labels.byId[lid].name);
			labelNames.forEach(labelName => {
				if (['Inbox'].includes(labelName))
					labels.byName[labelName].addUnreadThreadId(event.thread);
			});
		} else
			yield self.getLabels();

		const thread = threadsCache.getById(event.thread);
		console.log('event thread', thread);
		if (thread) {
			threadsCache.invalidate(event.thread);
			emailsCache.invalidate(event.thread);
		}

		yield self.getThreadById(event.thread);
		yield self.getEmailsByThreadId(event.thread);

		$rootScope.$broadcast(`inbox-emails`, event.thread);
		$rootScope.$broadcast(`inbox-new`, event.thread);
	});

	co(function *() {
		while (true) {
			if (events.length > 0) {
				const event = events.shift();
				yield handleEvent(event);
			}
			yield utils.sleep(100);
		}
	});

	$rootScope.whenInitialized(() => {
		$rootScope.$on('keyring-updated', () => {
			cache.invalidateAll();
			self.invalidateEmailCache();
			self.invalidateThreadCache();
		});
		$rootScope.$on('contacts-changed', () => {
			self.invalidateThreadCache();
		});
		$rootScope.$on('logout', () => {
			console.log('invalidate inbox caches');
			self.invalidateEmailCache();
			self.invalidateThreadCache();
		});

		LavaboomAPI.subscribe('receipt', (msg) => events.push(msg));
		LavaboomAPI.subscribe('delivery', (msg) => events.push(msg));
	});

	return $delegate;
};