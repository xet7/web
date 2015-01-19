var Buffer = require('buffer/').Buffer;

angular.module(primaryApplicationName).service('user', function($q, $rootScope, $state, $timeout, $window, consts, apiProxy, LavaboomAPI, co, app, crypto) {
	var self = this;

	this.name = '';
	this.email = '';
	this.nameEmail = '';

	// information about user from API
	this.settings = {

	};

	var token = sessionStorage.lavaboomToken ? sessionStorage.lavaboomToken : localStorage.lavaboomToken;
	var isAuthenticated = false;

	var setupUserBasicInformation = (username) => {
		self.name = username;
		self.email = `${username}@${consts.ROOT_DOMAIN}`;
		self.nameEmail = `${self.name} <${self.email}>`;
	};

	var persistAuth = (isRemember = true) => {
		var storage = isRemember ? localStorage : sessionStorage;
		storage.lavaboomToken = token;
	};

	this.calculateHash = (password) => (new Buffer(openpgp.crypto.hash.sha256(password), 'binary')).toString('hex');

	if (token)
		LavaboomAPI.setAuthToken(token);

	this.isAuthenticated = () => token && isAuthenticated;

	this.gatherUserInformation = () => {
		return co(function * () {
			var res = yield apiProxy(['accounts', 'get'], 'me');

			self.settings = res.body.settings;

			setupUserBasicInformation(res.body.user.name);

			if (!isAuthenticated) {
				isAuthenticated = true;
				$rootScope.$broadcast('user-authenticated');
			}

			return res.body;
		});
	};

	this.update = (settings) => {
		if (settings.firstName)
			self.settings.firstName = settings.firstName;
		if (settings.lastName)
			self.settings.lastName = settings.lastName;
		if (settings.displayName)
			self.settings.displayName = settings.displayName;
		return apiProxy(['accounts', 'update'], 'me', {
			settings: self.setting
		});
	};

	this.signIn = (username, password, isRemember, isPrivateComputer) => {
		setupUserBasicInformation(username);

		crypto.initialize({
			isRememberPasswords: isRemember
		});

		return co(function * (){
			try {
				var res = yield apiProxy(['tokens', 'create'], {
					type: 'auth',
					username: username,
					password: self.calculateHash(password)
				});

				token = res.body.token.id;
				LavaboomAPI.setAuthToken(token);
				persistAuth(isRemember);
				isAuthenticated = true;

				res = yield apiProxy(['keys', 'list'], self.name);
				if (!res.body.keys || res.body.keys.length < 1) {
					$state.go('generateKeys');
					return;
				}

				crypto.options.isPrivateComputer = isPrivateComputer;
				var r = crypto.authenticateDefault(password);
				console.log(r);

				$rootScope.$broadcast('user-authenticated');
			} catch (err) {
				$rootScope.$broadcast('user-authentication-error', err);
			}
		});
	};

	this.logout = () => {
		if (localStorage.lavaboomToken)
			delete localStorage.lavaboomToken;
		if (sessionStorage.lavaboomToken)
			delete sessionStorage.lavaboomToken;
		$window.location = consts.LOGIN_URL;
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
						$window.location = consts.LOGIN_URL;
				}
			}
			else if (app.isInboxApplication) {
				$window.location = consts.LOGIN_URL;
			}
		});
	};
});