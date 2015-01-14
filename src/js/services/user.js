angular.module(primaryApplicationName).service('user', function($q, $rootScope, $state, $timeout, $window, consts, apiProxy, LavaboomAPI, co) {
	var self = this;

	this.name = '';

	// information about user from API
	this.information = {

	};

	var token = sessionStorage.lavaboomToken ? sessionStorage.lavaboomToken : localStorage.lavaboomToken;

	if (token)
		LavaboomAPI.setAuthToken(token);

	this.isAuthenticated = () => !!token;

	this.gatherUserInformation = () => {
		return co(function * () {
			var res = yield apiProxy('accounts', 'get', 'me');

			return res.body;
		});
	};

	this.singIn = (username, password) => {
		self.name = username;

		return co(function * (){
			try {
				var res = yield apiProxy('tokens', 'create', {
					type: 'auth',
					username: username,
					password: CryptoJS.SHA3(password, { outputLength: 256 }).toString()
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

	this.persistAuth = (isRemember = true) => {
		var storage = isRemember ? localStorage : sessionStorage;
		storage.lavaboomToken = token;
	};

	this.checkAuth = () => {
		console.log('Checking authentication token...');
		if (self.isAuthenticated()) {
			if (primaryApplicationName == 'AppLavaboomLogin') {
				self.gatherUserInformation().then(() => {
					console.log('We are already authenticated with a valid token - going to the main application');
					$window.location = '/';
				});
			}
		}
		else if (primaryApplicationName == 'AppLavaboom') {
			$window.location = consts.loginUrl;
		}
	};
});


