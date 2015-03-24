module.exports = /*@ngInject*/function($q, $rootScope, $timeout, router, consts, co, LavaboomAPI, user, crypto, contacts, Email, Thread, Label) {
	const self = this;

	const newLineRegex = /(\r\n|\n)/g;

	this.selectedTidByLabelName = {};
	this.sortQuery = '-date_created';

	this.getThreadById = (threadId) => co(function *() {
		const thread = (yield LavaboomAPI.threads.get(threadId)).body.thread;

		return thread ? yield Thread.fromEnvelope(thread) : null;
	});

	this.requestDelete = (thread) => co(function *() {
		const labels = yield self.getLabels();

		const trashLabelId = labels.byName.Trash.id;
		const spamLabelId = labels.byName.Spam.id;
		const draftsLabelId = labels.byName.Drafts ? labels.byName.Drafts.id : null;

		const lbs = thread.labels;
		return lbs.includes(trashLabelId) || lbs.includes(spamLabelId) || (draftsLabelId && lbs.includes(draftsLabelId))
			? yield self.requestDeleteForcefully(thread)
			: yield self.requestSetLabel(thread, 'Trash');
	});

	this.requestDeleteForcefully = (thread) => co(function *() {
		yield LavaboomAPI.threads.delete(thread.id);
	});

	this.requestSetLabel = (thread, labelName) => co(function *() {
		const labels = yield self.getLabels();
		let labelId = labels.byName[labelName].id;

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
		const emails = (yield LavaboomAPI.emails.list({thread: threadId, sort: '-date_created'})).body.emails;

		return emails ? yield emails.map(e => Email.fromEnvelope(e)) : [];
	});

	this.setThreadReadStatus = (threadId) => co(function *(){
		const thread = (yield LavaboomAPI.threads.get(threadId)).body.thread;

		yield LavaboomAPI.threads.update(threadId, {
			is_read: true,

			// todo: hack
			labels: thread.labels
		});
	});

	this.getLabels = () => co(function *() {
		const labels = (yield LavaboomAPI.labels.list()).body.labels;

		const r = labels.reduce((a, labelOpts) => {
			const label = new Label(labelOpts);
			if (label.name == 'Drafts')
				return a;

			a.byName[label.name] = a.byId[label.id] = label;
			return a;
		}, {byName: {}, byId: {}, list: []});

		r.list = consts.ORDERED_LABELS.map(labelName => r.byName[labelName]).filter(e => !!e);

		$rootScope.$broadcast('inbox-labels', r);

		return r;
	});

	this.initialize = () => co(function *(){
		const info = yield LavaboomAPI.info();
		console.log('info', info);

		const labels = yield self.getLabels();

		/*if (!labels.byName.Drafts)
			yield self.createLabel('Drafts');*/
	});

	this.createLabel = (name) => co(function *(){
		yield LavaboomAPI.labels.create({name});
	});

	this.downloadAttachment = (email, attachmentId) => co(function *(){
		const res =  yield LavaboomAPI.files.list({
			email: email,
			name: attachmentId + '.pgp'
		});
		return (yield crypto.decodeEnvelope(res.body.files[0], '', 'raw')).data;
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
		const labels = yield self.getLabels();
		const label = labels.byName[labelName];

		const threads = (yield LavaboomAPI.threads.list({
			label: label.id,
			attachments_count: true,
			sort: self.sortQuery,
			offset: offset,
			limit: limit
		})).body.threads;

		return threads ? yield threads.map(t => co(function *(){
			const cachedThread = yield self.getThreadById(t.id, true);
			if (cachedThread)
				return cachedThread;
			return yield co.def(Thread.fromEnvelope(t), null);
		})) : [];
	});

	this.getKeyForEmail = (email) => co(function * () {
		const res = yield LavaboomAPI.keys.get(email);
		return res.body.key;
	});

	let sendEnvelope = null;
	let isSecured = false;

	this.send = (opts, manifest, keys) => co(function * () {
		isSecured = Email.isSecuredKeys(keys);
		sendEnvelope = yield Email.toEnvelope(opts, manifest, keys);
	});

	this.getMumbledFormattedBody = () => {
		return sendEnvelope && sendEnvelope.body ? sendEnvelope.body.replace(newLineRegex, '<br />') : '';
	};

	this.confirmSend = () =>  co(function * () {
		const res = yield LavaboomAPI.emails.create(sendEnvelope);

		sendEnvelope = null;

		return res.body.id;
	});

	this.rejectSend = () => {
		sendEnvelope = null;
	};
};