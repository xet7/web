angular.module(primaryApplicationName).service('inbox', function($q, $rootScope, co, apiProxy, crypto, cryptoKeys) {
	var self = this;

	this.emails = [];
	this.selected = null;
	this.senders = {};
	this.totalEmailsCount = 0;
	this.isInboxLoading = false;

	crypto.initialize();

	var decode = (body, pgpFingerprints, defaultBody = '') => {
		var deferred = $q.defer();

		if (!body) {
			deferred.resolve(defaultBody);
			return deferred.promise;
		}
		if (pgpFingerprints.length > 0)
			return crypto.decodeByListedFingerprints(body, pgpFingerprints);

		deferred.resolve(body);
		return deferred.promise;
	};

	this.requestList = () => {
		self.isInboxLoading = true;

		return co(function * (){
			try {
				var res = yield apiProxy('emails', 'list', {});

				self.emails = res.body.emails ? res.body.emails.map(e => {
					var email = {
						id: e.id,
						subject: e.name,
						date: e.date_created,
						preview: '',
						previewState: 'processing',
						body: '',
						bodyState: 'processing'
					};

					decode(e.preview.raw, e.preview.pgp_fingerprints)
						.then(value => {
							email.preview = value;
							email.previewState = 'ok';
						})
						.catch(err => {
							email.preview = err.message;
							email.previewState = 'error';
						});
					decode(e.body.raw, e.body.pgp_fingerprints)
						.then(value => {
							email.body = value;
							email.bodyState = 'ok';
						})
						.catch(err => {
							email.body = err.message;
							email.bodyState = 'error';
						});

					return email;
				}) : [];

				$rootScope.$broadcast('inbox-emails', self.emails);
			} finally {
				self.isInboxLoading = false;
			}
		});
	};

	this.send = (to, subject, body) => {
		return co(function * () {
			var res = yield apiProxy('keys', 'get', to);
			var publicKey = res.body.key;
			var encryptedMessage = yield crypto.encodeWithKey(to, body, publicKey.key);

			console.log(encryptedMessage, publicKey.id);

			apiProxy('emails', 'create', {
				to: [to],
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