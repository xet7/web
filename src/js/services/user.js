angular.module(primaryApplicationName).service('user', function($q, $rootScope, $state, $timeout, $window, consts, apiProxy, LavaboomAPI, co) {
	var self = this;

	this.name = '';
	this.email = '';
	this.nameEmail = '';

	// information about user from API
	this.information = {

	};

	var token = sessionStorage.lavaboomToken ? sessionStorage.lavaboomToken : localStorage.lavaboomToken;

	this.calculateHash = (password) => CryptoJS.SHA3(password, { outputLength: 256 }).toString();

	if (token)
		LavaboomAPI.setAuthToken(token);

	this.isAuthenticated = () => !!token;

	this.gatherUserInformation = () => {
		return co(function * () {
			var res = yield apiProxy('accounts', 'get', 'me');

			return res.body;
		});
	};

	this.signIn = (username, password) => {
		self.name = username;
		self.email = `${username}@${consts.rootDomain}`;
		self.nameEmail = `${self.name} <${self.email}>`;

		return co(function * (){
			try {
				var res = yield apiProxy('tokens', 'create', {
					type: 'auth',
					username: username,
					password: self.calculateHash(password)
				});

				token = res.body.token.id;
				LavaboomAPI.setAuthToken(token);

				$rootScope.$broadcast('user-authenticated');
			} catch (err) {
				$rootScope.$broadcast('user-authentication-error', err);
			} finally {
				self.isInboxLoading = false;
			}
		});
	};

	this.reserve = (username, email) => {
		return co(function * (){
			var res = yield apiProxy('accounts', 'reserve', 'username', {
				username: username,
				email: email
			});

			return res.body;
		});
	};

	this.persistAuth = (isRemember = true) => {
		var storage = isRemember ? localStorage : sessionStorage;
		storage.lavaboomToken = token;
	};

	this.checkAuth = () => {
		console.log('Checking authentication token...');

		return co(function * () {
			if (self.isAuthenticated()) {
				if (primaryApplicationName == 'AppLavaboomLogin') {
					try {
						yield self.gatherUserInformation();
					} catch (err) {
						return true;
					}

					console.log('We are already authenticated with a valid token - going to the main application');
					$window.location = '/';
				}
			}
			else if (primaryApplicationName == 'AppLavaboom') {
				$window.location = consts.loginUrl;
			}
		});
	};
});


