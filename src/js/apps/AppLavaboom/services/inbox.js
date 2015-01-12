angular.module(primaryApplicationName).service('inbox', function($q, $rootScope, LavaboomAPI) {
	var self = this;

	this.emails = [];
	this.isInboxLoading = false;

	this.requestList = () => {
		self.isInboxLoading = true;

		LavaboomAPI.emails.list()
			.then(function (res) {
				self.emails = res.emails;

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

	this.scroll = () => {
		self.isInboxLoading = true;
	};
});