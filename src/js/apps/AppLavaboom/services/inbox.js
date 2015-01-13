angular.module(primaryApplicationName).service('inbox', function($q, $rootScope, LavaboomAPI) {
	var self = this;

	this.emails = [];
	this.senders = {};
	this.totalEmailsCount = 0;

	this.isInboxLoading = false;



	this.requestList = () => {
		self.isInboxLoading = true;

		LavaboomAPI.emails.list()
			.then(function (res) {
				var getAccountPromises = [];

				var emails = res.emails.map(e => {

					if (!(e.owner in self.senders)) {
						self.senders[e.owner] = null;

						getAccountPromises.push(
							LavaboomAPI.accounts.get(e.owner)
								.then(sender => {
									self.senders[e.owner] = sender;
									console.log('got sender, LavaboomAPI.accounts.get: ', sender);
								})
						);
					}

					return {
						subject: e.name,
						date: e.date_created,
						desc: 'no desc'
					};
				});

				$q.all(getAccountPromises)
					.then(() => {
						console.log('all get accounts resolved!');
					});


				$rootScope.$broadcast('inbox-emails', self.emails);
				console.log('LavaboomAPI.emails.list: ', res);
			})
			.catch(function (err) {
				console.log('LavaboomAPI.emails.list error: ', err.message, err.stack);
			})
			.finally(function () {
				self.isInboxLoading = false;
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