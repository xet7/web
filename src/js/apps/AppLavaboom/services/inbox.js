module.exports = /*@ngInject*/function($q, $rootScope, $timeout, router, consts, co, LavaboomAPI, user, crypto, contacts, Email, Thread, Label) {
	const self = this;

	const handleEvent = (event) => co(function *(){
		console.log('got server event', event);

		const labelNames = event.labels.map(lid => self.labelsById[lid].name);
		labelNames.forEach(labelName => {
			self.labelsByName[labelName].addUnreadThreadId(event.thread);
		});
	});

	this.getThreadById = (threadId) => co(function *() {
		const thread = (yield LavaboomAPI.threads.get(threadId)).body.thread;

		return thread ? yield Thread.fromEnvelope(thread) : null;
	});

	this.requestDelete = (thread) => co(function *() {
		const trashLabelId = self.labelsByName.Trash.id;
		const spamLabelId = self.labelsByName.Spam.id;
		const draftsLabelId = self.labelsByName.Drafts.id;

		const lbs = thread.labels;
		return lbs.includes(trashLabelId) || lbs.includes(spamLabelId) || lbs.includes(draftsLabelId)
			? yield LavaboomAPI.threads.delete(thread.id)
			: yield self.requestSetLabel(thread.id, 'Trash');
	});

	this.requestSetLabel = (thread, labelName) => co(function *() {
		let labelId = self.labelsByName[labelName].id;

		const newLabels = [labelId];
		yield LavaboomAPI.threads.update(thread.id, {labels: newLabels});

		return newLabels;
	});

	this.requestSwitchLabel = (thread, labelName) => co(function *() {
		if (thread.isLabel(labelName)) {
			console.log('label found - remove');
			return yield self.requestRemoveLabel(thread, labelName);
		} else {
			console.log('label not found - add');
			return yield self.requestAddLabel(thread, labelName);
		}
	});

	this.requestRemoveLabel = (thread, labelName) => co(function *() {
		let newLabels = thread.removeLabel(labelName);
		yield LavaboomAPI.threads.update(thread.id, {labels: newLabels});

		return newLabels;
	});

	this.requestAddLabel = (thread, labelName) => co(function *() {
		const newLabels = thread.addLabel(labelName);
		yield LavaboomAPI.threads.update(thread.id, {labels: newLabels});

		return newLabels;
	});

	this.getEmailsByThreadId = (threadId) => co(function *() {
		const emails = (yield LavaboomAPI.emails.list({thread: threadId})).body.emails;

		return emails ? yield emails.map(e => Email.fromEnvelope(e)) : [];
	});

	this.setThreadReadStatus = (threadId) => co(function *(){
		// hack
		const thread = (yield LavaboomAPI.threads.get(threadId)).body.thread;

		yield LavaboomAPI.threads.update(threadId, {
			is_read: true,
			labels: thread.labels
		});

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

		let labels = yield self.getLabels();

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

	this.requestList = (labelName, offset, limit) => co(function *() {
		const label = self.labelsByName[labelName];

		const threads = (yield LavaboomAPI.threads.list({
			label: label.id,
			attachments_count: true,
			sort: '-date_modified',
			offset: offset,
			limit: limit
		})).body.threads;

		return threads ? yield threads.map(t => co.def(Thread.fromEnvelope(t), null)) : [];
	});

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