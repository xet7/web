module.exports = /*@ngInject*/function($q, $rootScope, $timeout, consts, co, LavaboomAPI, user, crypto, contacts, Cache, Email, Thread, Label) {
	var self = this;

	this.offset = 0;
	this.limit = 15;
	this.emails = [];
	this.selected = null;

	this.labelName = '';
	this.labelsById = {};
	this.labelsByName = {};
	this.threads = {};
	this.threadsList = [];

	var defaultCacheOptions = {
		ttl: consts.INBOX_THREADS_CACHE_TTL
	};
	var cacheOptions = angular.extend({}, defaultCacheOptions, {
		ttl: consts.INBOX_EMAILS_CACHE_TTL,
		isInvalidateWholeCache: true
	});
	var threadsCaches = [];
	var emailsListCache = new Cache(defaultCacheOptions);

	this.invalidateThreadCache = () => {
		for(let labelName in threadsCaches)
			threadsCaches[labelName].invalidateAll();
	};

	this.invalidateEmailCache = () => {
		emailsListCache.invalidateAll();
	};

	var handleEvent = (event) => co(function *(){
		console.log('got server event', event);

		var labelNames = event.labels.map(lid => self.labelsById[lid].name);
		labelNames.forEach(labelName => {
			threadsCaches[labelName].invalidateAll();
			self.labelsByName[labelName].addUnreadThreadId(event.thread);
		});

		if (labelNames.includes(self.labelName)) {
			var thread = yield self.getThreadById(event.thread);
			self.threads[thread.id] = thread;
			self.threadsList.unshift(thread);
			self.threadsList = _.uniq(self.threadsList, t => t.id);
		}
	});

	var deleteThreadLocally = (threadId) => {
		if (self.threads[threadId]) {
			delete self.threads[threadId];
			self.threadsList.splice(self.threadsList.findIndex(thread => thread.id == threadId), 1);
		}
	};

	var performsThreadsOperation = (operation) => co(function *() {
		var currentLabelName = self.labelName;

		var r = yield operation;

		$rootScope.$broadcast(`inbox-threads[${currentLabelName}]`);

		return r;
	});

	var getThreadsByLabelName = (labelName) => co(function *() {
		var label = self.labelsByName[labelName];

		var threads = (yield LavaboomAPI.threads.list({
			label: label.id,
			attachments_count: true,
			sort: '-date_modified',
			offset: self.offset,
			limit: self.limit
		})).body.threads;

		var result = {
			list: [],
			map: {}
		};

		if (threads) {
			result = Object.keys(threads).reduce((a, i) => {
				var thread = new Thread(threads[i]);
				a.map[thread.id] = thread;
				a.list.push(thread);
				return a;
			}, result);
		}

		return result;
	});

	this.getThreadById = (threadId) => co(function *() {
		var thread = (yield LavaboomAPI.threads.get(threadId)).body.thread;

		return thread ? new Thread(thread) : null;
	});

	this.requestDelete = (threadId) => performsThreadsOperation(co(function *() {
		var thread = self.threads[threadId];
		var trashLabelId = self.labelsByName.Trash.id;
		var spamLabelId = self.labelsByName.Spam.id;
		var draftsLabelId = self.labelsByName.Drafts.id;

		threadsCaches[self.labelName].invalidateAll();

		var r;
		var lbs = thread.labels;
		if (lbs.includes(trashLabelId) || lbs.includes(spamLabelId) || lbs.includes(draftsLabelId))
			r = yield LavaboomAPI.threads.delete(threadId);
		else
			r = yield self.requestSetLabel(threadId, 'Trash');

		deleteThreadLocally(threadId);

		return r;
	}));

	this.requestSetLabel = (threadId, labelName) => performsThreadsOperation(co(function *() {
		var currentLabelName = self.labelName;

		var labelId = self.labelsByName[labelName].id;

		for(let c in threadsCaches)
			threadsCaches[c].invalidateAll();

		var r =  yield LavaboomAPI.threads.update(threadId, {labels: [labelId]});

		if (labelName != currentLabelName)
			deleteThreadLocally(threadId);

		return r;
	}));

	this.requestSwitchLabel = (threadId, labelName) => performsThreadsOperation(co(function *() {
		var thread = self.threads[threadId];

		if (thread.isLabel(labelName)) {
			console.log('label found - remove');

			threadsCaches[labelName].invalidateAll();

			var newLabels = thread.removeLabel(labelName);
			var r = yield LavaboomAPI.threads.update(threadId, {labels: newLabels});

			if (self.labelName == 'Starred')
				deleteThreadLocally(threadId);

			thread.labels = newLabels;
			return r;
		} else {
			console.log('label not found - add');
			return yield self.requestAddLabel(threadId, labelName);
		}
	}));

	this.requestAddLabel = (threadId, labelName) => performsThreadsOperation(co(function *() {
		var thread = self.threads[threadId];

		threadsCaches[labelName].invalidateAll();

		var newLabels = thread.addLabel(labelName);
		var r = yield LavaboomAPI.threads.update(threadId, {labels: newLabels});

		thread.labels = newLabels;
		return r;
	}));

	this.getEmailsByThreadId = (threadId) => emailsListCache.call(
		(threadId) => co(function *() {
			var emails = (yield LavaboomAPI.emails.list({thread: threadId})).body.emails;

			return yield (emails ? emails : []).map(e => Email.fromEnvelope(e));
		}),
		[threadId]
	);

	this.setThreadReadStatus = (threadId) => co(function *(){
		if (self.threads[threadId].is_read)
			return;

		yield LavaboomAPI.threads.update(threadId, {
			is_read: true,
			labels: self.threads[threadId].labels
		});

		self.threads[threadId].is_read = true;

		var labels = yield self.getLabels();
		self.labelsByName = labels.byName;
		self.labelsById = labels.byId;

		$rootScope.$broadcast('inbox-labels');
	});

	this.getLabels = () => co(function *() {
		var labels = (yield LavaboomAPI.labels.list()).body.labels;

		threadsCaches = [];
		return labels.reduce((a, label) => {
			threadsCaches[label.name] = new Cache(cacheOptions);
			a.byName[label.name] = a.byId[label.id] = new Label(label);
			return a;
		}, {byName: {}, byId: {}});
	});

	this.initialize = () => co(function *(){
		var labels = yield self.getLabels();

		if (!labels.byName.Drafts) {
			yield LavaboomAPI.labels.create({name: 'Drafts'});
			labels = yield self.getLabels();
		}

		self.labelsByName = labels.byName;
		self.labelsById = labels.byId;

		$rootScope.$broadcast('inbox-labels');

		yield self.requestList('Inbox');
	});

	this.uploadAttachment = (envelope) => co(function *(){
		return yield LavaboomAPI.attachments.create(envelope);
	});

	this.deleteAttachment = (attachmentId) => co(function *(){
		return yield LavaboomAPI.attachments.delete(attachmentId);
	});

	this.getEmail = (emailId) => co(function *(){
		var r = yield LavaboomAPI.emails.get(emailId);

		return r.body.email ? new Email(r.body.email) : null;
	});

	this.requestList = (labelName) => {
		if (self.labelName != labelName) {
			self.offset = 0;
			self.threads = {};
			self.threadsList = [];
		}

		self.labelName = labelName;

		return performsThreadsOperation(co(function * (){
			var e = yield threadsCaches[labelName].call(() => getThreadsByLabelName(labelName), [self.offset, self.limit]);

			if (e.list.length > 0)
				self.offset += e.list.length;

			self.threads = angular.extend(self.threads, e.map);
			self.threadsList = _.uniq(self.threadsList.concat(e.list), t => t.id);

			return e;
		}));
	};

	this.getKeyForEmail = (email) => co(function * () {
		var r = yield LavaboomAPI.keys.get(email);
		return r.body.key;
	});

	this.send = (...args) => co(function * () {
		var envelope = yield Email.toEnvelope(...args);

		var res = yield LavaboomAPI.emails.create(envelope);

		return res.body.id;
	});

	$rootScope.whenInitialized(() => {
		LavaboomAPI.subscribe('receipt', (msg) => performsThreadsOperation(handleEvent(msg)));
		LavaboomAPI.subscribe('delivery', (msg) => performsThreadsOperation(handleEvent(msg)));

		$rootScope.$on('logout', () => {
			self.invalidateEmailCache();
			self.invalidateThreadCache();
		});
	});
};