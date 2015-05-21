module.exports = /*@ngInject*/function($q, $rootScope, $state, $timeout, $window, $translate, $templateCache, $interpolate,
									   consts, LavaboomAPI, LavaboomHttpAPI, co, crypto, cryptoKeys, loader, utils, Key) {
	const self = this;

	const translations = {
		LB_BYE: ''
	};
	$translate.bindAsObject(translations, 'LOADER');

	this.name = '';
	this.styledName = '';
	this.email = '';
	this.styledEmail = '';
	this.nameEmail = '';
	this.altEmail = '';
	this.aliases = [];
	this.accountType = '';

	// information about user from API
	this.settings = {};

	this.defaultSettings = {
		isSignatureEnabled: true,
		isSkipComposeScreenWarning: false,
		isHotkeyEnabled: true,
		isUnknownContactsAutoComplete: false,
		images: 'none', // none, proxy, directHttps, directAll,
		styles: 'none', // none, all

		// not implemented
		mailComposedAction: 'none',
		mailSpamAction: 'none',
		mailDeletedAction: 'none'
		// not implemented
	};

	// primary key
	this.key = null;

	this.isHiddenAccountType = (accountType = self.accountType) => accountType == 'beta' || accountType == 'superuser';

	let token = null;
	let isAuthenticated = false;

	function setupSettings (settings) {
		return co(function *(){
			self.defaultSettings.signatureHtml = yield utils.fetchAndCompile('LavaMail/inbox/defaultSignature');

			console.warn(self.defaultSettings.signatureHtml);

			self.settings = angular.extend({},
				self.defaultSettings,
				settings ? settings : {}
			);
		});
	}

	function gatherAndSetupInformation () {
		return co(function *() {
			let [account, addresses] = yield [LavaboomAPI.accounts.get('me'), LavaboomAPI.addresses.get()];
			let aliases = addresses.body.addresses && angular.isArray(addresses.body.addresses)
				? addresses.body.addresses.map(a => a.id)
				: [];

			yield setupSettings(account.body.user.settings);
			setupUserBasicInformation(account.body.user.name, account.body.user.styled_name, account.body.user.type, account.body.alt_email, aliases);
		});
	}

	function setupUserBasicInformation (username, styledUsername, type, altEmail, aliases) {
		self.name = username;
		self.styledName = styledUsername;
		self.email = `${username}@${consts.ROOT_DOMAIN}`;
		self.styledEmail = `${styledUsername}@${consts.ROOT_DOMAIN}`;
		self.nameEmail = `${self.name} <${self.email}>`;
		self.altEmail = altEmail;
		self.accountType = type;
		self.aliases = aliases ? aliases.map(a => `${a}@${consts.ROOT_DOMAIN}`) : [];
	}

	function restoreAuth () {
		token = sessionStorage['lava-token'] ? sessionStorage['lava-token'] : localStorage['lava-token'];

		if (token) {
			LavaboomAPI.setAuthToken(token);
			LavaboomHttpAPI.setAuthToken(token);
		}
	}

	this.styleEmail = (email) => email.replace(self.name, self.styledName);

	this.persistAuth = (isRemember = true) => {
		let storage = isRemember ? localStorage : sessionStorage;
		storage['lava-token'] = token;

		localStorage['sign-in-settings'] = JSON.stringify({
			isPrivateComputer: isRemember
		});
	};

	this.calculateHash = crypto.hash;

	this.isAuthenticated = () => token && isAuthenticated;

	this.syncKeys = () => co(function *(){
		let res = yield LavaboomAPI.keys.list(self.name);

		let keysByFingerprint = res.body.keys ? utils.toMap(res.body.keys) : {};

		let publicKeys = crypto.getAvailablePublicKeysForEmail(self.email);
		let keysCreationPromises = [];

		publicKeys.forEach(key => {
			if (!keysByFingerprint[key.primaryKey.fingerprint]) {
				console.log(`Importing key with fingerprint '${key.primaryKey.fingerprint}' to the server...`);

				keysCreationPromises.push(LavaboomAPI.keys.create(key.armor()));
			} else
				console.log(`Key with fingerprint '${key.primaryKey.fingerprint}' already imported...`);
		});

		for(let k of Object.keys(keysByFingerprint))
			crypto.importPublicKey(keysByFingerprint[k].key);

		yield keysCreationPromises;
	});

	this.authenticate = () => co(function * () {
		restoreAuth();
		yield gatherAndSetupInformation();
		$rootScope.$broadcast('user-settings');

		if (!isAuthenticated) {
			isAuthenticated = true;
			$rootScope.$broadcast('user-authenticated');
		}
	});

	this.gatherUserInformation = () => co(function * () {
		yield self.authenticate();

		yield self.syncKeys();
		if (self.settings.isLavaboomSynced) {
			crypto.initialize({isShortMemory: self.settings.isLavaboomSynced});
			cryptoKeys.importKeys(self.settings.keyring);
		}

		let res = yield LavaboomAPI.keys.get(self.email);
		self.key = new Key(crypto.readKey(res.body.key.key));

		if (!isAuthenticated) {
			isAuthenticated = true;
			$rootScope.$broadcast('user-authenticated');
		}

		return res.body;
	});

	this.startOnboarding = () => {
		return LavaboomAPI.accounts.startOnboarding('me');
	};

	this.update = (settings) => {
		angular.extend(self.settings, settings);
		return LavaboomAPI.accounts.update('me', {
			settings: self.settings
		});
	};

	this.updatePassword = (oldPassword, newPassword) => co(function *(){
		yield LavaboomAPI.accounts.update('me', {
			current_password: self.calculateHash(oldPassword),
			new_password: self.calculateHash(newPassword)
		});
	});

	this.updateKey = (fingerprint) => co(function * () {
		return yield LavaboomAPI.accounts.update('me', {
			public_key: fingerprint
		});
	});

	this.signIn = (username, password, isRemember, isPrivateComputer) => {
		setupUserBasicInformation(username.split('@')[0].trim());

		crypto.initialize();

		return co(function * (){
			try {
				restoreAuth();

				let addresses = null;
				let res = yield LavaboomAPI.tokens.create({
					type: 'auth',
					username: username,
					password: self.calculateHash(password)
				});

				token = res.body.token.id;
				LavaboomAPI.setAuthToken(token);
				LavaboomHttpAPI.setAuthToken(token);
				self.persistAuth(isRemember);
				isAuthenticated = true;

				yield gatherAndSetupInformation();
				crypto.initialize({isPrivateComputer: isPrivateComputer, email: self.email, isShortMemory: self.settings.isLavaboomSynced});

				res = yield LavaboomAPI.keys.list(self.name);
				if (!res.body.keys || res.body.keys.length < 1) {
					yield $state.go('generateKeys');
					return;
				}

				// todo: probably we don't need this
				try {
					res = yield LavaboomAPI.keys.get(self.email);
				} catch (err) {
					yield $state.go('generateKeys');
					return;
				}

				self.key = new Key(crypto.readKey(res.body.key.key));

				if (self.settings.isLavaboomSynced)
					cryptoKeys.importKeys(self.settings.keyring);

				crypto.authenticateByEmail(self.email, password);

				$rootScope.$broadcast('user-authenticated');
			} catch (err) {
				$rootScope.$broadcast('user-authentication-error', err);
				throw err;
			}
		});
	};

	this.removeTokens = () => {
		delete localStorage['lava-token'];
		delete sessionStorage['lava-token'];
	};

	this.logout = () => co(function *(){
		$rootScope.$broadcast('logout');

		self.settings = {};
		self.removeTokens();
		crypto.removeSensitiveKeys();

		LavaboomAPI.setAuthToken('');
		LavaboomHttpAPI.setAuthToken('');
		isAuthenticated = false;
		token = '';

		yield $state.go('empty');

		loader.resetProgress();
		loader.showLoader(true);
		loader.loadLoginApplication({lbDone: translations.LB_BYE});
	});
};