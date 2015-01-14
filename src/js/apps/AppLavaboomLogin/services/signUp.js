angular.module(primaryApplicationName).service('signUp', function(apiProxy, co, user) {
	var self = this;

	this.plan = null;
	this.tokenSignup = null;
	this.details = null;

	this.signUp = (password) => {
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


