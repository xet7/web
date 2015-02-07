var chan = require('chan');

angular.module(primaryApplicationName).service('inbox', function($q, $rootScope, $timeout, co, apiProxy, Cache, LavaboomAPI, crypto, contacts, Email, Thread) {
	var self = this;

	this.offset = 0;
	this.limit = 15;
	this.emails = [];
	this.selected = null;
	this.totalEmailsCount = 0;

	this.labelName = '';
	this.labelsByName = [];
	this.threads = {};
	this.threadsList = [];

	var defaultCacheOptions = {
		ttl: 60 * 1000
	};
	var cacheOptions = angular.extend({}, defaultCacheOptions, {
		isInvalidateWholeCache: true
	});
	var threadsCaches = [];
	var emailsListCache = new Cache(defaultCacheOptions);

	$timeout(() => {
		LavaboomAPI.subscribe('receipt', (msg) => {
			console.log('receipt', msg);
		});

		LavaboomAPI.subscribe('delivery', (msg) => {
			console.log('delivery', msg);
		});
	}, 3000);

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

		var threads = (yield apiProxy(['threads', 'list'], {
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
		var thread = (yield apiProxy(['threads', 'get'], threadId)).body.thread;

		return thread ? new Thread(thread) : null;
	});

	this.requestDelete = (threadId) => performsThreadsOperation(co(function *() {
		var thread = self.threads[threadId];
		var trashLabelId = self.labelsByName.Trash.id;
		var spamLabelId = self.labelsByName.Spam.id;
		var draftsLabelId = self.labelsByName.Drafts.id;

		var r;
		if (thread.labels.indexOf(trashLabelId) > -1 || thread.labels.indexOf(spamLabelId) > -1 || thread.labels.indexOf(draftsLabelId) > -1)
			r = yield apiProxy(['threads', 'delete'], threadId);
		else
			r = yield self.requestSetLabel(threadId, 'Trash');

		deleteThreadLocally(threadId);

		return r;
	}));

	this.requestSetLabel = (threadId, labelName) => performsThreadsOperation(co(function *() {
		var currentLabelName = self.labelName;

		var labelId = self.labelsByName[labelName].id;
		var r =  yield apiProxy(['threads', 'update'], threadId, {labels: [labelId]});

		if (labelName != currentLabelName)
			deleteThreadLocally(threadId);

		return r;
	}));

	this.requestAddLabel = (threadId, labelName) => performsThreadsOperation(co(function *() {
		var labelId = self.labelsByName[labelName].id;
		var thread = self.threads[threadId];

		return yield apiProxy(['threads', 'update'], threadId, {labels: _.union(thread.labels, [labelId])});
	}));

	this.getEmailsByThreadId = (threadId, decodeChan) => emailsListCache.call(
		(threadId, decodeChan) => co(function *() {
			var emails = (yield apiProxy(['emails', 'list'], {thread: threadId})).body.emails;

			return yield (emails ? emails : []).map(e => Email.fromEnvelope(e));
		}),
		[threadId, decodeChan]
	);

	this.getLabels = (classes = {}) => co(function *() {
		var labels = (yield apiProxy(['labels', 'list'])).body.labels;

		threadsCaches = [];
		return labels.reduce((a, label) => {
			label.iconClass = `icon-${classes[label.name] ? classes[label.name] :label.name.toLowerCase()}`;
			a[label.name] = label;
			threadsCaches[label.name] = new Cache(cacheOptions);
			return a;
		}, {});
	});

	this.initialize = (decodeChan) => co(function *(){
		var labelsClasses = {
			'Drafts': 'draft',
			'Spam': 'ban',
			'Starred': 'star'
		};

		var labels = yield self.getLabels(labelsClasses);

		if (!labels.Drafts) {
			yield apiProxy(['labels', 'create'], {name: 'Drafts'});
			labels = yield self.getLabels(labelsClasses);
		}

		self.labelsByName = labels;

		$rootScope.$broadcast('inbox-labels', self.labels);

		yield self.requestList('Inbox', decodeChan);
	});

	this.uploadAttachment = (envelope) => co(function *(){
		return yield apiProxy(['attachments', 'create'], envelope);
	});

	this.deleteAttachment = (attachmentId) => co(function *(){
		return yield apiProxy(['attachments', 'delete'], attachmentId);
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
			self.threadsList = self.threadsList.concat(e.list);

			return e;
		}));
	};

	this.send = (to, cc, bcc, subject, body, attachments, thread_id = null) => co(function * () {
		var res = yield apiProxy(['keys', 'get'], to);
		var publicKey = res.body.key;
		var encryptedMessage = yield crypto.encodeWithKey(body, publicKey.key);

		yield apiProxy(['emails', 'create'], {
			to: to,
			cc: cc,
			bcc: bcc,
			subject: subject,
			body: encryptedMessage,
			pgp_fingerprints: [publicKey.id],
			attachments: attachments,
			thread_id: thread_id
		});
	});

	this.scroll = () => {
		self.isInboxLoading = true;
	};
});