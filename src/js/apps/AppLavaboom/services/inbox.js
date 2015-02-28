module.exports = /*@ngInject*/function($q, $rootScope, $timeout, router, consts, co, LavaboomAPI, user, crypto, contacts, Email, Thread, Label) {
	const self = this;

	const handleEvent = (event) => co(function *(){
		console.log('got server event', event);

		const labelNames = event.labels.map(lid => self.labelsById[lid].name);
		labelNames.forEach(labelName => {
			self.labelsByName[labelName].addUnreadThreadId(event.thread);
		});

		let thread = yield self.getThreadById(event.thread);

		labelNames.forEach(labelName => {
			self.threads[thread.id] = thread;
			self.threadsList[labelName].unshift(thread);
			self.threadsList[labelName] = _.uniq(self.threadsList[labelName], t => t.id);
		});
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

	this.requestDelete = (threadId) => co(function *() {
		const thread = self.threads[threadId];
		const trashLabelId = self.labelsByName.Trash.id;
		const spamLabelId = self.labelsByName.Spam.id;
		const draftsLabelId = self.labelsByName.Drafts.id;

		const lbs = thread.labels;
		return lbs.includes(trashLabelId) || lbs.includes(spamLabelId) || lbs.includes(draftsLabelId)
			? yield LavaboomAPI.threads.delete(threadId)
			: yield self.requestSetLabel(threadId, 'Trash');
	});

	this.requestSetLabel = (threadId, labelName) => co(function *() {
		let labelId = self.labelsByName[labelName].id;

		return yield LavaboomAPI.threads.update(threadId, {labels: [labelId]});
	});

	this.requestSwitchLabel = (threadId, labelName) => co(function *() {
		let thread = self.threads[threadId];

		if (thread.isLabel(labelName)) {
			console.log('label found - remove');

			let newLabels = thread.removeLabel(labelName);
			return yield LavaboomAPI.threads.update(threadId, {labels: newLabels});
		} else {
			console.log('label not found - add');
			return yield self.requestAddLabel(threadId, labelName);
		}
	});

	this.requestAddLabel = (threadId, labelName) => co(function *() {
		const thread = self.threads[threadId];

		const newLabels = thread.addLabel(labelName);
		return yield LavaboomAPI.threads.update(threadId, {labels: newLabels});
	});

	this.getEmailsByThreadId = (threadId) => co(function *() {
		const emails = (yield LavaboomAPI.emails.list({thread: threadId})).body.emails;

		return yield (emails ? emails : []).map(e => Email.fromEnvelope(e));
	});

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

		return labels.reduce((a, label) => {
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

		return co(function * (){
			let e = yield getThreadsByLabelName(labelName, offset, limit);

			self.threads = angular.extend(self.threads, e.map);
			self.threadsList[labelName] = _.uniq(self.threadsList[labelName].concat(e.list), t => t.id);

			return e;
		});
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
		LavaboomAPI.subscribe('receipt', (msg) => handleEvent(msg));
		LavaboomAPI.subscribe('delivery', (msg) => handleEvent(msg));
	});
};