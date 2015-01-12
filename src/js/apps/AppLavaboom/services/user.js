angular.module(primaryApplicationName).service('user', function($q, $rootScope, LavaboomAPI) {
	var self = this;

	this.name = 'Tester';

	var token = null;

	var setToken = (_token) => {
		token = _token;
		LavaboomAPI.setAuthToken(token.id);
	};

	this.singIn = (username, password) => {
		LavaboomAPI.tokens.create({
			type: 'auth',
			username: username,
			password: CryptoJS.SHA3(password, { outputLength: 256 }).toString()
		}).then(function (res) {
			setToken(res.token);

			$rootScope.$broadcast('user-authenticated');
			console.log('LavaboomAPI.tokens.create: ', res);
		})
		.catch(function (err) {
			$rootScope.$broadcast('user-authentication-error', err);
			console.log('LavaboomAPI.tokens.create: ', err.message, err.stack);
		})
		.finally(function () {
			self.isInboxLoading = false;
		});
	};
});
