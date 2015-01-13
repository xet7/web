angular.module(primaryApplicationName).service('inbox', function($q, $rootScope, co, apiProxy, LavaboomAPI) {
	var self = this;

	this.emails = [];
	this.senders = {};
	this.totalEmailsCount = 0;
	this.isInboxLoading = false;

	this.requestList = () => {
		self.isInboxLoading = true;

		return co(function * (){
			try {
				var res = yield apiProxy('LavaboomAPI.emails.list', LavaboomAPI.emails.list);

				self.emails = res.emails.map(e => {
					return {
						id: e.id,
						subject: e.name,
						date: e.date_created,
						desc: 'no desc'
					};
				});

				console.log('self.emails', self.emails);

				$rootScope.$broadcast('inbox-emails', self.emails);
			} finally {
				self.isInboxLoading = false;
			}
		});
	};

	this.send = (to, subject, body) => {
		LavaboomAPI.emails.create({
			to: to,
			subject: subject,
			is_encrypted: false,
			body: body
		})
			.then(function (res) {
				console.log('LavaboomAPI.emails.create: ', res);
			})
			.catch(function (err) {
				console.log('LavaboomAPI.emails.create error: ', err.message, err.stack);
			});
	};

	this.scroll = () => {
		self.isInboxLoading = true;
	};
});