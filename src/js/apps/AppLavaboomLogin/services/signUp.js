angular.module(primaryApplicationName).service('signUp', function(apiProxy, co, user) {
	var self = this;

	this.reserve = null;
	this.plan = null;
	this.tokenSignup = null;
	this.details = null;
	this.password = null;

	this.register = (username, altEmail, isNews) => {
		self.reserve = {
			username: username,
			altEmail: altEmail,
			isNews: isNews
		};

		return co(function * (){
			var res = yield apiProxy(['accounts', 'create', 'register'], {
				username: username,
				alt_email: altEmail
			});

			return res.body;
		});
	};

	this.verifyInvite = (form) => {
		self.tokenSignup = form;

		return co(function * (){
			var res = yield apiProxy(['accounts', 'create', 'verify'], {
				username: self.tokenSignup.username,
				invite_code: self.tokenSignup.token
			});

			return res.body;
		});
	};

	this.setup = (password) => {
		self.password = password;
		return co(function * (){
			yield apiProxy(['accounts', 'create', 'setup'], {
				username: self.tokenSignup.username,
				invite_code: self.tokenSignup.token,
				password: user.calculateHash(password)
			});

			yield user.signIn(self.tokenSignup.username, password, true);

			yield user.update(self.details);

			return res.body;
		});
	};
});