angular.module(primaryApplicationName).service('signUp', function(apiProxy, co, user) {
	var self = this;

	this.plan = null;
	this.tokenSignup = null;
	this.details = null;
	this.password = null;

	this.verifyInvite = (form) => {
		self.tokenSignup = form;

		return co(function * (){
			var res = yield apiProxy('accounts', 'create', 'verify', {
				username: self.tokenSignup.username,
				invite_code: self.tokenSignup.token
			});

			return res.body;
		});
	};

	this.signUp = (password) => {
		self.password = password;
		return co(function * (){
			var res = yield apiProxy('accounts', 'create', 'invited', {
				username: self.tokenSignup.username,
				password: user.calculateHash(password),
				token: self.tokenSignup.token
			});

			return res.body;
		});
	};
});


