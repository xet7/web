angular.module(primaryApplicationName).service('inbox', function($q, $rootScope, co, apiProxy, crypto, cryptoKeys) {
	var self = this;

	this.emails = [];
	this.senders = {};
	this.totalEmailsCount = 0;
	this.isInboxLoading = false;

	this.requestList = () => {
		self.isInboxLoading = true;

		return co(function * (){
			try {
				var res = yield apiProxy('emails', 'list');

				self.emails = res.emails ? res.emails.map(e => {
					return {
						id: e.id,
						subject: e.name,
						date: e.date_created,
						desc: 'no desc'
					};
				}) : [];

				console.log('self.emails', self.emails);

				$rootScope.$broadcast('inbox-emails', self.emails);
			} finally {
				self.isInboxLoading = false;
			}
		});
	};

	this.send = (to, subject, body) => {
		return co(function * () {
			var res = yield apiProxy('keys', 'get', to);
			cryptoKeys.importPublicKey(res.key.key);

			var encryptedEmail = yield crypto.encode(to, body);
			console.log('encryptedEmail', encryptedEmail);


			/*apiProxy('emails', 'create', {
				to: to,
				subject: subject,
				is_encrypted: false,
				body: body
			});*/
		});
	};

	this.scroll = () => {
		self.isInboxLoading = true;
	};
});