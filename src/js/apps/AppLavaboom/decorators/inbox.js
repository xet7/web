module.exports = /*@ngInject*/($delegate, $rootScope, $translate, co, consts, Cache, Proxy) => {
	const self = $delegate;

	const proxy = new Proxy($delegate);

	const CACHE_UNFOLD = {
		unfold: item => item.id
	};

	let cache = new Cache('default cache', {
		ttl: 15000//consts.INBOX_LABELS_CACHE_TTL
	});
	let threadsCache = new Cache('threads cache', angular.extend({},
		{
			ttl: 10000//consts.INBOX_THREADS_CACHE_TTL
		},
		{
			list: value => value.list
		},
		CACHE_UNFOLD
	));
	let emailsCache = new Cache('emails cache', angular.extend({},
		{
			ttl: 10000//consts.INBOX_EMAILS_CACHE_TTL
		},
		CACHE_UNFOLD
	));

	const updateThreadLabels = (thread, labelsById, newLabels) => co(function *(){
		// remove labels that do not exist in updated thread
		thread.labels.forEach(lid => {
			if (newLabels.includes(lid))
				return;

			const labelName = labelsById[lid].name;

			const threads = threadsCache.get(labelName);
			if (threads) {
				const index = threads.list.findIndex(curThread => curThread.id == thread.id);
				if (index > -1)
					threads.list.splice(index, 1);
			}
		});

		// add new labels
		newLabels.forEach(lid => {
			if (thread.labels.includes(lid))
				return;

			const labelName = labelsById[lid].name;

			const threads = threadsCache.get(labelName);
			if (threads)
				threads.list.push(thread);
		});

		thread.labels = newLabels;
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
	}, true);

	const requestListProxy = function *(requestList, args) {
		let [labelName, offset, limit] = args;

		console.log('proxy requestList', labelName, offset, limit);

		let value = threadsCache.get(labelName);
		if (!value || (!value.isEnd && offset >= value.list.length)) {
			console.log('doing requestList api call with args', args, new Error());
			let newList = yield requestList(...args);
			if (!newList)
				newList = [];

			threadsCache.put(labelName, {
				list: value && value.list ? _.uniq(value.list.concat(newList), t => t.id) : newList,
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

		// todo: get rid of uniq(api bug)
		return _.uniq(value.list, t => t.id).slice(offset, offset + limit);
	}, true);

	self.requestListDirect = proxy.unbindedMethodCall('requestList', function *(requestList, args) {
		let [labelName, offset, limit] = args;

		const value = yield requestListProxy(requestList, args);

		// todo: get rid of uniq(api bug)
		return _.uniq(value.list, t => t.id).slice(offset, offset + limit);
	}, true);

	proxy.methodCall('getThreadById', function *(getThreadById, args) {
		const [threadId] = args;

		const r = threadsCache.getById(threadId);
		if (r)
			return r;

		const thread = yield getThreadById(...args);

		const labels = yield self.getLabels();

		thread.labels.forEach(labelId => {
			const labelName = labels.byId[labelId].name;
			threadsCache.unshiftOnlyIfKeyIsPreset(labelName, thread);

			$rootScope.$broadcast(`inbox-threads`, labelName);
		});

		return thread;
	}, true);

	const requestModifyLabelProxy = function *(requestModifyLabel, args){
		const [thread] = args;

		const labels = yield self.getLabels();
		const newLabels = yield requestModifyLabel(...args);
		const setLabels = new Set([...thread.labels.map(labelId => labels.byId[labelId].name), ...newLabels.map(labelId => labels.byId[labelId].name)]);
		const allLabels = [...setLabels.values()];

		// update cache if any
		const oldThread = threadsCache.getById(thread.id);
		if (oldThread) {
			const labelsRes = yield self.getLabels();

			yield updateThreadLabels(oldThread, labelsRes.byId, newLabels);
		}

		for(let labelName of allLabels) {
			console.log('requestModifyLabel proxy label update: ', labelName);

			$rootScope.$broadcast(`inbox-threads`, labelName);
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

	proxy.methodCall('__handleEvent', function *(__handleEvent, args) {
		const [event] = args;

		const labels = cache.get('labels');
		console.log('__handleEvent', labels);
		if (labels) {
			const labelNames = event.labels.map(lid => labels.byId[lid].name);
			labelNames.forEach(labelName => {
				labels.byName[labelName].addUnreadThreadId(event.thread);
			});
		} else
			yield self.getLabels();

		yield self.getThreadById(event.thread);

		yield __handleEvent(...args);
	});

	$delegate.invalidateThreadCache = () => {
		threadsCache.invalidateAll();
	};

	$delegate.invalidateEmailCache = () => {
		emailsCache.invalidateAll();
	};

	$rootScope.whenInitialized(() => {
		$rootScope.$on('keyring-updated', () => {
			cache.invalidateAll();
			self.invalidateEmailCache();
			self.invalidateThreadCache();
		});
		$rootScope.$on('logout', () => {
			self.invalidateEmailCache();
			self.invalidateThreadCache();
		});
	});

	return $delegate;
};