angular.module(primaryApplicationName).service('inbox', function($q, $rootScope, $timeout, co, apiProxy, LavaboomAPI, crypto, cryptoKeys) {
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

	var decode = (body, pgpFingerprints, defaultBody = '') => co(function *(){
		if (!body)
			return defaultBody;

		if (pgpFingerprints.length > 0)
			return (yield crypto.decodeByListedFingerprints(body, pgpFingerprints));

		return body;
	});

	var decodeFinished = (decodeChan) => {
		co(function*(){
			self.decryptingCurrent++;
			yield decodeChan({current: self.decryptingCurrent, total: self.decryptingTotal});
			if (self.decryptingCurrent >= self.decryptingTotal)
				decodeChan.close();
		});
	};

	this.requestDelete = (id) => {
		apiProxy(['emails', 'delete'], id);
		self.requestList();
	};

	this.requestStar = (id) => {

	};

	this.getThreadsByLabelName = function *(labelName, decodeChan) {
		var label = self.labelsByName[labelName];
		var threads = (yield apiProxy(['threads', 'list'], {label: label.id})).body.threads;

		self.decryptingCurrent = 0;
		if (threads) {
			self.decryptingTotal = threads.length;

			return yield co.reduce(threads, function *(a, thread) {
				thread.headerEmail = createEmail((yield apiProxy(['emails', 'get'], thread.emails[0])).body.email, decodeChan);
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

	this.initialize = (decodeChan) => co(function *(){
		var labels = (yield apiProxy(['labels', 'list'])).body.labels;

		self.labelsByName = labels.reduce((a, label) => {
			label.iconClass = `icon-${label.name.toLowerCase()}`;
			a[label.name] = label;
			return a;
		}, {});

		$rootScope.$broadcast('inbox-labels', self.labels);

		yield self.requestList('Inbox', decodeChan);

		console.log(self.threads);
	});

	var createEmail = (e, decodeChan) => {
		var isPreviewAvailable = !!e.preview;

		console.log('CREATE EMAIL FROM', e);

		var email = {
			id: e.id,
			isEncrypted: e.body.pgp_fingerprints.length > 0 || (e.preview && e.preview.pgp_fingerprints.length) > 0,
			subject: e.name,
			date: e.date_created,
			from: e.from,
			preview: '',
			previewState: 'processing',
			body: '',
			bodyState: 'processing',
			attachments: e.attachments
		};

		if (isPreviewAvailable)
			decode(e.preview.raw, e.preview.pgp_fingerprints)
				.then(value => {
					email.preview = value;
					email.previewState = 'ok';
				})
				.catch(err => {
					email.preview = err.message;
					email.previewState = 'error';
				})
				.finally(() => {
					if (decodeChan)
						decodeFinished(decodeChan);
				});

		decode(e.body.raw, e.body.pgp_fingerprints)
			.then(value => {
				email.body = value;
				email.bodyState = 'ok';

				if (!isPreviewAvailable) {
					email.preview = value;
					email.previewState = 'ok';
				}
			})
			.catch(err => {
				email.body = err.message;
				email.bodyState = 'error';

				if (!isPreviewAvailable) {
					email.preview = err.message;
					email.previewState = 'error';
				}
			})
			.finally(() => {
				if (decodeChan)
					decodeFinished(decodeChan);
			});

		return email;
	};

	this.requestList = (labelName, decodeChan = null) => co(function * (){
		self.threads = yield self.getThreadsByLabelName(labelName, decodeChan);

		$rootScope.$broadcast('inbox-threads', self.threads);
	});

	this.send = (to, subject, body) => {
		return co(function * () {
			var res = yield apiProxy(['keys', 'get'], to);
			var publicKey = res.body.key;
			var encryptedMessage = yield crypto.encodeWithKey(to, body, publicKey.key);

			console.log(encryptedMessage, publicKey.id);

			apiProxy(['emails', 'create'], {
				to: to,
				subject: subject,
				body: encryptedMessage,
				pgp_fingerprints: [publicKey.id]
			});
		});
	};

	this.scroll = () => {
		self.isInboxLoading = true;
	};
});