angular.module(primaryApplicationName).service('inbox', function($q, $rootScope, co, apiProxy, crypto, cryptoKeys) {
	var self = this;

	this.emails = [];
	this.selected = null;
	this.senders = {};
	this.totalEmailsCount = 0;
	this.isInboxLoading = false;

	crypto.initialize();

	this.requestList = () => {
		self.isInboxLoading = true;

		return co(function * (){
			try {
				var res = yield apiProxy('emails', 'list', {});

				self.emails = res.body.emails ? res.body.emails.map(e => {
					return {
						id: e.id,
						subject: e.name,
						date: e.date_created,
						preview: e.preview.raw,
						body: e.body.raw
					};
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

			apiProxy('emails', 'create', {
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