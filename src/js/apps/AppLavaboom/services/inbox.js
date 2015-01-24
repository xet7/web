angular.module(primaryApplicationName).service('inbox', function($q, $rootScope, $timeout, co, apiProxy, LavaboomAPI, crypto, cryptoKeys) {
	var self = this;

	this.emails = [];
	this.selected = null;
	this.totalEmailsCount = 0;
	this.decryptingTotal = 0;
	this.decryptingCurrent = 0;
	this.isDecrypted = false;
	this.labelsByName = [];
	this.threadsByLabelName = {

	};

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

	var decodeFinished = () => {
		self.decryptingCurrent++;
		$rootScope.$broadcast('inbox-decrypt-status', {current: self.decryptingCurrent, total: self.decryptingTotal});
	};

	this.requestDelete = (id) => {
		apiProxy(['emails', 'delete'], id);
		self.requestList();
	};

	this.requestStar = (id) => {

	};

	this.initialize = () => co(function *(){
		var labels = (yield apiProxy(['labels', 'list'])).body.labels;

		self.labelsByName = labels.reduce((a, label) => {
			label.iconClass = `icon-${label.name.toLowerCase()}`;
			a[label.name] = label;
			return a;
		}, {});

		self.threadsByLabelName = yield co.reduce(self.labelsByName, function *(a, label) {
			var threads = (yield apiProxy(['threads', 'list'], {label: label.id})).body.threads;

			a[label.name] = yield co.reduce(threads, function *(a, thread) {
				thread.headerEmail = (yield apiProxy(['emails', 'get'], thread.emails[0])).body.email;
				a[thread.id] = thread;
				return a;
			}, {});

			return a;
		}, {});

		console.log('self.threadsByLabel', self.threadsByLabelName);


		$rootScope.$broadcast('inbox-labels', self.labels);
	});

	this.requestList = (labelName) => {
		var labelId = null;

		if (labelName != 'Inbox') {
			if (!self.labels[labelName]) {
				console.error('requestList unknown label name', labelName);
				return;
			}
			labelId = self.labels[labelName].id;
		}

		self.isInboxLoading = true;
		self.isDecrypted = true;

		return co(function * (){
			try {
				var res = yield apiProxy(['emails', 'list'], labelId ? {label: labelId} : {});

				self.decryptingCurrent = 0;
				if (res.body.emails) {
					self.decryptingTotal = res.body.emails.length;

					self.emails = res.body.emails.map(e => {
						var isPreviewAvailable = !!e.preview;

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
								.finally(decodeFinished);

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
							.finally(decodeFinished);

						return email;
					});
				} else {
					self.emails = [];
					$rootScope.$broadcast('inbox-decrypt-status', {current: 0, total: 0});
				}

				$rootScope.$broadcast('inbox-emails', self.emails);
			} finally {
				self.isInboxLoading = false;
			}
		});
	};

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