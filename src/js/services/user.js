angular.module(primaryApplicationName).service('user', function($q, $rootScope, $state, $timeout, $window, consts, apiProxy, LavaboomAPI, co, app, crypto) {
	var self = this;

	this.name = '';
	this.email = '';
	this.nameEmail = '';

	// information about user from API
	this.information = {

	};

	var token = sessionStorage.lavaboomToken ? sessionStorage.lavaboomToken : localStorage.lavaboomToken;
	var isAuthenticated = false;

	var setupUserBasicInformation = (username) => {
		self.name = username;
		self.email = `${username}@${consts.rootDomain}`;
		self.nameEmail = `${self.name} <${self.email}>`;
	};

	this.calculateHash = (password) => CryptoJS.SHA3(password, { outputLength: 256 }).toString();

	if (token)
		LavaboomAPI.setAuthToken(token);

	this.isAuthenticated = () => token && isAuthenticated;

	this.gatherUserInformation = () => {
		return co(function * () {
			var res = yield apiProxy('accounts', 'get', 'me');

			setupUserBasicInformation(res.body.user.name);

			if (!isAuthenticated) {
				isAuthenticated = true;
				$rootScope.$broadcast('user-authenticated');
			}

			return res.body;
		});
	};

	this.signIn = (username, password, isRemember) => {
		setupUserBasicInformation(username);

		crypto.initialize({
			isRememberPasswords: isRemember
		});

		return co(function * (){
			try {
				var res = yield apiProxy('tokens', 'create', {
					type: 'auth',
					username: username,
					password: self.calculateHash(password)
				});

				token = res.body.token.id;
				LavaboomAPI.setAuthToken(token);
				var r = crypto.authenticateDefault(password);
				console.log(r);

				isAuthenticated = true;
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
			if (token) {
				try {
					yield self.gatherUserInformation();

					if (app.isLoginApplication) {
						console.log('We are already authenticated with a valid token - going to the main application');
						$window.location = '/';
					}
				} catch (err) {
					if (app.isLoginApplication)
						return true;
					if (app.isInboxApplication)
						$window.location = consts.loginUrl;
				}
			}
			else if (app.isInboxApplication) {
				$window.location = consts.loginUrl;
			}
		});
	};
});


