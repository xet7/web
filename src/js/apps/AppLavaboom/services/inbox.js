var chan = require('chan');

angular.module(primaryApplicationName).service('inbox', function($q, $rootScope, $timeout, co, apiProxy, LavaboomAPI, crypto, contacts, cryptoKeys) {
	var self = this;

	this.emails = [];
	this.selected = null;
	this.totalEmailsCount = 0;
	this.decryptingTotal = 0;
	this.decryptingCurrent = 0;

	this.labelsByName = [];
	this.threads = [];

	$timeout(() => {
		LavaboomAPI.subscribe('receipt', (msg) => {
			console.log('receipt', msg);
		});

		LavaboomAPI.subscribe('delivery', (msg) => {
			console.log('delivery', msg);
		});
	}, 3000);

	var decode = (body, pgpFingerprints, decodeChan, defaultBody = '') => co(function *(){
		try {
			if (!body)
				return {
					text: defaultBody,
					state: 'ok'
				};

			if (pgpFingerprints.length > 0)
				return {
					text: yield crypto.decodeByListedFingerprints(body, pgpFingerprints),
					state: 'ok'
				};

			return {
				text: body,
				state: 'ok'
			};
		} catch (error) {
			return {
				text: error.message,
				state: 'error'
			};
		} finally {
			self.decryptingCurrent++;

			if (decodeChan) {
				yield decodeChan({current: self.decryptingCurrent, total: self.decryptingTotal});
				if (self.decryptingCurrent >= self.decryptingTotal)
					decodeChan.close();
			}
		}
	});

	this.requestDelete = (id) => {
		apiProxy(['emails', 'delete'], id);
		self.requestList();
	};

	this.requestStar = (id) => {

	};

	this.getEmailsByThreadId = (threadId, decodeChan) => co(function *() {
		var emails = (yield apiProxy(['emails', 'list'], {thread: threadId})).body.emails;

		return yield emails.map(e => createEmail(e, decodeChan));
	});

	this.getThreadsByLabelName = function *(labelName, decodeChan) {
		var label = self.labelsByName[labelName];
		var threads = (yield apiProxy(['threads', 'list'], {label: label.id})).body.threads;

		self.decryptingCurrent = 0;
		if (threads) {
			self.decryptingTotal = threads.length;

			return yield co.reduce(threads, function *(a, thread) {
				thread.headerEmail = yield createEmail((yield apiProxy(['emails', 'get'], thread.emails[0])).body.email, decodeChan);
				console.log('THREAD HEADER EMAIL IS', thread.headerEmail);
				a[thread.id] = thread;
				return a;
			}, {});
		} else {
			if (decodeChan) {
				yield decodeChan({current: 0, total: 0});
				decodeChan.close();
			}
			return [];
		}
	};

	this.getLabels = () => co(function *() {
		var labels = (yield apiProxy(['labels', 'list'])).body.labels;

		return labels.reduce((a, label) => {
			label.iconClass = `icon-${label.name.toLowerCase()}`;
			a[label.name] = label;
			return a;
		}, {});
	});

	this.initialize = (decodeChan) => co(function *(){
		var labels = yield self.getLabels();

		if (!labels.Drafts) {
			yield apiProxy(['labels', 'create'], {name: 'Drafts'});
			labels = yield self.getLabels();
		}

		self.labelsByName = labels;

		$rootScope.$broadcast('inbox-labels', self.labels);

		yield self.requestList('Inbox', decodeChan);

		console.log(self.threads);
	});

	var createEmail = (e, decodeChan) => {
		var isPreviewAvailable = !!e.preview;

		var ch = chan();
		return {
			id: e.id,
			isEncrypted: e.body.pgp_fingerprints.length > 0 || (e.preview && e.preview.pgp_fingerprints.length) > 0,
			subject: e.name,
			date: e.date_created,
			from: e.from,
			fromName: contacts.getContactByEmail(e.from).name,
			preview: isPreviewAvailable ? decode(e.preview.raw, e.preview.pgp_fingerprints, decodeChan) : co(function *(){
				return yield ch;
			}),
			body: co(function *(){
				var r = yield decode(e.body.raw, e.body.pgp_fingerprints, decodeChan);
				if (!isPreviewAvailable)
					ch(r);
				return r;
			}),
			attachments: e.attachments
		};
	};

	this.requestList = (labelName, decodeChan = null) => co(function * (){
		self.threads = yield self.getThreadsByLabelName(labelName, decodeChan);

		$rootScope.$broadcast('inbox-threads', self.threads);
	});

	this.send = (to, cc, bcc, subject, body, thread_id = null) => co(function * () {
		var res = yield apiProxy(['keys', 'get'], to);
		var publicKey = res.body.key;
		var encryptedMessage = yield crypto.encodeWithKey(to, body, publicKey.key);

		yield apiProxy(['emails', 'create'], {
			to: to,
			cc: cc,
			bcc: bcc,
			subject: subject,
			body: encryptedMessage,
			pgp_fingerprints: [publicKey.id],
			thread_id: thread_id
		});
	});

	this.scroll = () => {
		self.isInboxLoading = true;
	};
});