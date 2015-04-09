module.exports = /*@ngInject*/function (LavaboomAPI, co, user, $http) {
	const self = this;

	this.reserve = null;
	this.plan = null;
	this.tokenSignup = null;
	this.details = null;
	this.password = null;
	this.isPartiallyFlow = false;

	this.register = (username, altEmail) => {
		self.reserve = {
			originalUsername: username,
			username: username,
			altEmail: altEmail
		};

		return co(function * (){
			let res = yield LavaboomAPI.accounts.create.register({
				username: username,
				alt_email: altEmail
			});

			return res.body;
		});
	};

	this.verifyInvite = (username, token, isNews) => {
		self.tokenSignup = {
			username: username,
			token: token,
			isNews: isNews
		};

		return co(function * (){
			let res = yield LavaboomAPI.accounts.create.verify({
				username: self.tokenSignup.username,
				invite_code: self.tokenSignup.token
			});

			return res.body;
		});
	};

	this.setup = (password) => {
		self.password = password;
		return co(function * (){
			yield LavaboomAPI.accounts.create.setup({
				username: self.tokenSignup.username,
				invite_code: self.tokenSignup.token,
				password: user.calculateHash(password)
			});

			yield user.signIn(self.tokenSignup.username, password, true);

			let settings = angular.extend({},
				self.details,
				user.defaultSettings, {
					isSubscribedToNews: self.tokenSignup.isNews,
					state: 'incomplete'
				});

			yield user.update(settings);

			if (user.settings.isSubscribedToNews)
				co(function *(){
					const res = yield $http({
						method: 'POST',
						url: 'https://technical.lavaboom.com/subscribe',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded'
						},
						transformRequest: function(obj) {
							var str = [];
							for(var p in obj)
								str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
							return str.join('&');
						},
						data: {
							name: user.name,
							email: user.altEmail,
							list: 'YAUEUIgnZs1u6nPTYqjcDw'
						}
					});

					console.log('subscribe result', res);
				});
		});
	};
};