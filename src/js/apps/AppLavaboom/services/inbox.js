module.exports = /*@ngInject*/function($q, $rootScope, $timeout, router, consts, co, LavaboomAPI, user, crypto, contacts, Cache, Email, Thread, Label) {
	const self = this;

	const defaultCacheOptions = {
		ttl: consts.INBOX_THREADS_CACHE_TTL
	};
	const cacheOptions = angular.extend({}, defaultCacheOptions, {
		ttl: consts.INBOX_EMAILS_CACHE_TTL,
		isInvalidateWholeCache: true
	});
	const emailsListCache = new Cache(defaultCacheOptions);
	let threadsCaches = [];

	this.invalidateThreadCache = () => {
		for(let labelName of Object.keys(threadsCaches)) {
			console.log('invalidate thread cache for label', labelName, '...');
			threadsCaches[labelName].invalidateAll();
		}
	};

	this.invalidateEmailCache = () => {
		console.log('invalidate email cache...');
		emailsListCache.invalidateAll();
	};

	const handleEvent = (event) => co(function *(){
		console.log('got server event', event);

		const labelNames = event.labels.map(lid => self.labelsById[lid].name);
		labelNames.forEach(labelName => {
			threadsCaches[labelName].invalidateAll();
			self.labelsByName[labelName].addUnreadThreadId(event.thread);
		});

		let thread = yield self.getThreadById(event.thread);

		labelNames.forEach(labelName => {
			self.threads[thread.id] = thread;
			self.threadsList[labelName].unshift(thread);
			self.threadsList[labelName] = _.uniq(self.threadsList[labelName], t => t.id);
		});
	});

	const setThreadLabelsLocally = (threadId, labelIds) => {
		const thread = self.threads[threadId];
		console.log('setThreadLabelsLocally', labelIds, labelIds.map(lid => self.labelsById[lid].name));
		if (thread) {
			thread.labels.forEach(lid => {
				if (labelIds.includes(lid))
					return;

				let list = self.threadsList[self.labelsById[lid].name];
				const index = list.findIndex(thread => thread.id == threadId);
				if (index > -1)
					list.splice(index, 1);
			});

			labelIds.forEach(lid => {
				const labelName = self.labelsById[lid].name;
				const list = self.threadsList[labelName];

				if (!list.find(thread => thread.id == threadId))
					self.threadsList[labelName].push(thread);
			});

			thread.labels = labelIds;
		}
	};

	const deleteThreadLocally = (threadId) => {
		if (self.threads[threadId]) {
			self.threads[threadId].labels.forEach(lid => {
				let list = self.threadsList[self.labelsById[lid].name];
				const index = list.findIndex(thread => thread.id == threadId);
				if (index > -1)
					list.splice(index, 1);
			});
			delete self.threads[threadId];
		}
	};

	const performsThreadsOperation = (operation) => co(function *() {
		let r = yield operation;

		$rootScope.$broadcast(`inbox-threads`);

		return r;
	});

	const getThreadsByLabelName = (labelName, offset, limit) => co(function *() {
		const label = self.labelsByName[labelName];

		const threads = (yield LavaboomAPI.threads.list({
			label: label.id,
			attachments_count: true,
			sort: '-date_modified',
			offset: offset,
			limit: limit
		})).body.threads;

		const result = {
			list: [],
			map: {}
		};

		if (threads) {
			return (yield threads.map(t => co.def(Thread.fromEnvelope(t), null))).reduce((a, t) => {
				if (t) {
					a.map[t.id] = t;
					a.list.push(t);
				}
				return a;
			}, result);
		}

		return result;
	});

	this.getThreadById = (threadId) => co(function *() {
		const thread = (yield LavaboomAPI.threads.get(threadId)).body.thread;

		return thread ? yield Thread.fromEnvelope(thread) : null;
	});

	this.requestDelete = (threadId) => performsThreadsOperation(co(function *() {
		const thread = self.threads[threadId];
		const trashLabelId = self.labelsByName.Trash.id;
		const spamLabelId = self.labelsByName.Spam.id;
		const draftsLabelId = self.labelsByName.Drafts.id;

		thread.labels.forEach(lid => {
			const labelName = self.labelsById[lid].name;
			threadsCaches[labelName].invalidateAll();
		});

		const lbs = thread.labels;
		const r = lbs.includes(trashLabelId) || lbs.includes(spamLabelId) || lbs.includes(draftsLabelId)
			? yield LavaboomAPI.threads.delete(threadId)
			: yield self.requestSetLabel(threadId, 'Trash');

		deleteThreadLocally(threadId);

		return r;
	}));

	this.requestSetLabel = (threadId, labelName) => performsThreadsOperation(co(function *() {
		let labelId = self.labelsByName[labelName].id;

		for(let c of Object.keys(threadsCaches))
			threadsCaches[c].invalidateAll();

		let res = yield LavaboomAPI.threads.update(threadId, {labels: [labelId]});

		setThreadLabelsLocally(threadId, [labelId]);

		return res;
	}));

	this.requestSwitchLabel = (threadId, labelName) => performsThreadsOperation(co(function *() {
		let thread = self.threads[threadId];

		if (thread.isLabel(labelName)) {
			console.log('label found - remove');

			thread.labels.forEach(lid =>
				threadsCaches[self.labelsById[lid].name].invalidateAll()
			);

			let newLabels = thread.removeLabel(labelName);
			let res = yield LavaboomAPI.threads.update(threadId, {labels: newLabels});

			setThreadLabelsLocally(threadId, newLabels);

			return res;
		} else {
			console.log('label not found - add');
			return yield self.requestAddLabel(threadId, labelName);
		}
	}));

	this.requestAddLabel = (threadId, labelName) => performsThreadsOperation(co(function *() {
		const thread = self.threads[threadId];

		threadsCaches[labelName].invalidateAll();

		const newLabels = thread.addLabel(labelName);
		const res = yield LavaboomAPI.threads.update(threadId, {labels: newLabels});

		setThreadLabelsLocally(threadId, newLabels);

		return res;
	}));

	this.getEmailsByThreadId = (threadId) => emailsListCache.call(
		(threadId) => co(function *() {
			const emails = (yield LavaboomAPI.emails.list({thread: threadId})).body.emails;

			return yield (emails ? emails : []).map(e => Email.fromEnvelope(e));
		}),
		[threadId]
	);

	this.setThreadReadStatus = (threadId) => co(function *(){
		const thread = self.threads[threadId];
		if (thread.isRead)
			return;

		yield LavaboomAPI.threads.update(threadId, {
			is_read: true,
			labels: thread.labels
		});

		thread.isRead = true;

		const labels = yield self.getLabels();
		self.labelsByName = labels.byName;
		self.labelsById = labels.byId;

		$rootScope.$broadcast('inbox-labels');
	});

	this.getLabels = () => co(function *() {
		const labels = (yield LavaboomAPI.labels.list()).body.labels;

		threadsCaches = [];
		return labels.reduce((a, label) => {
			threadsCaches[label.name] = new Cache(cacheOptions);
			a.byName[label.name] = a.byId[label.id] = new Label(label);
			return a;
		}, {byName: {}, byId: {}});
	});

	this.initialize = () => co(function *(){
		self.emails = [];
		self.selected = null;

		self.labelsById = {};
		self.labelsByName = {};
		self.threads = {};

		let labels = yield self.getLabels();

		self.threadsList = Object.keys(labels.byName).reduce((a, name) => {
			a[name] = [];
			return a;
		}, {});

		if (!labels.byName.Drafts) {
			yield LavaboomAPI.labels.create({name: 'Drafts'});
			labels = yield self.getLabels();
		}

		self.labelsByName = labels.byName;
		self.labelsById = labels.byId;

		$rootScope.$broadcast('inbox-labels');
	});

	this.downloadAttachment = (id) => co(function *(){
		const res =  yield LavaboomAPI.files.get(id);
		return (yield crypto.decodeEnvelope(res.body.file, '', 'raw')).data;
	});

	this.uploadAttachment = (envelope) => co(function *(){
		return yield LavaboomAPI.files.create(envelope);
	});

	this.deleteAttachment = (attachmentId) => co(function *(){
		return yield LavaboomAPI.files.delete(attachmentId);
	});

	this.getEmailById = (emailId) => co(function *(){
		const res = yield LavaboomAPI.emails.get(emailId);

		return res.body.email ? Email.fromEnvelope(res.body.email) : null;
	});

	this.requestList = (labelName, offset, limit) => {
		if (offset === 0)
			self.threadsList[labelName] = [];

		return performsThreadsOperation(co(function * (){
			let e = yield threadsCaches[labelName].call(() => getThreadsByLabelName(labelName, offset, limit), [offset, limit]);

			self.threads = angular.extend(self.threads, e.map);
			self.threadsList[labelName] = _.uniq(self.threadsList[labelName].concat(e.list), t => t.id);

			return e;
		}));
	};

	this.getKeyForEmail = (email) => co(function * () {
		const res = yield LavaboomAPI.keys.get(email);
		return res.body.key;
	});

	let sendEnvelope = null;

	this.send = (opts, manifest, keys) => co(function * () {
		sendEnvelope = yield Email.toEnvelope(opts, manifest, keys);

		return {
			isEncrypted: sendEnvelope.kind == 'manifest'
		};
	});

	this.confirmSend = () =>  co(function * () {
		const res = yield LavaboomAPI.emails.create(sendEnvelope);

		sendEnvelope = null;

		return res.body.id;
	});

	this.rejectSend = () => {
		sendEnvelope = null;
	};

	$rootScope.whenInitialized(() => {
		LavaboomAPI.subscribe('receipt', (msg) => performsThreadsOperation(handleEvent(msg)));
		LavaboomAPI.subscribe('delivery', (msg) => performsThreadsOperation(handleEvent(msg)));

		$rootScope.$on('logout', () => {
			self.invalidateEmailCache();
			self.invalidateThreadCache();
		});
	});
};