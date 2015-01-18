angular.module(primaryApplicationName).service('crypto', function($q, consts) {
	var self = this;

	var wrapOpenpgpKeyring = (keyring) => {
		var findByFingerprint = (keys, fingerprint) => {
			for(var i = 0; i < keys.length; i++)
				if (keys[i].primaryKey.fingerprint == fingerprint)
					return keys[i];
			return null;
		};

		var findIndexByFingerprint = (keys, fingerprint) => {
			for(var i = 0; i < keys.length; i++)
				if (keys[i].primaryKey.fingerprint == fingerprint)
					return i;
			return null;
		};

		keyring.publicKeys.findByFingerprint = (fingerprint) => findByFingerprint(keyring.publicKeys.keys, fingerprint);
		keyring.privateKeys.findByFingerprint = (fingerprint) => findByFingerprint(keyring.privateKeys.keys, fingerprint);

		keyring.publicKeys.findIndexByFingerprint = (fingerprint) => findIndexByFingerprint(keyring.publicKeys.keys, fingerprint);
		keyring.privateKeys.findIndexByFingerprint = (fingerprint) => findIndexByFingerprint(keyring.privateKeys.keys, fingerprint);

		return keyring;
	};

	var sessionDecryptedStore = new openpgp.Keyring.localstore();
	sessionDecryptedStore.storage = window.sessionStorage;

	var localDecryptedStore = new openpgp.Keyring.localstore('openpgp-decrypted-');

	var keyring = window.keyring = wrapOpenpgpKeyring(new openpgp.Keyring());
	var localKeyring = window.localKeyring = wrapOpenpgpKeyring(new openpgp.Keyring(localDecryptedStore));
	var sessionKeyring = window.sessionKeyring = wrapOpenpgpKeyring(new openpgp.Keyring(sessionDecryptedStore));

	this.options = {};
	this.keyring = keyring;

	var getAvailableEmails = (keys) => Object.keys(keys.keys.reduce((a, k) => {
		var email = k.users[0].userId.userid.match(/<([^>]+)>/)[1];
		a[email] = true;
		return a;
	}, {}));

	this.getAvailablePrivateKeys = () => keyring.privateKeys;

	this.getAvailablePrivateDecryptedKeys = () => sessionKeyring.privateKeys;

	this.getAvailableDestinationEmails = () => getAvailableEmails(keyring.publicKeys);

	this.getAvailableSourceEmails = () => getAvailableEmails(keyring.privateKeys);

	this.getAvailablePublicKeysForSourceEmails = () => {
		var emails = getAvailableEmails(keyring.privateKeys);
		return emails.reduce((a, email) => {
			a[email] = keyring.publicKeys.getForAddress(email);
			return a;
		}, {});
	};

	var isInitialized = false;

	this.initialize = (opt = {}) => {
		if (!opt.isPrivateComputer)
			opt.isPrivateComputer = false;

		self.options = opt;

		if (!isInitialized) {
			openpgp.initWorker('/vendor/openpgp.worker.js');
			isInitialized = true;
		}
	};

	var applyPasswordToKeyPair = (privateKey, password) => {
		try {
			return privateKey.decrypt(password);
		} catch (catchedError) {
			console.error(catchedError);
			return false;
		}
	};

	this.generateKeys = (nameEmail, password, numBits) => {
		if (!numBits)
			numBits = consts.DEFAULT_KEY_LENGTH;

		console.log('generating keys', nameEmail, password, numBits);

		var deferred = $q.defer();
		openpgp.generateKeyPair({numBits: numBits, userId: nameEmail, passphrase: password})
			.then(freshKeys => {
				keyring.publicKeys.importKey(freshKeys.publicKeyArmored);
				keyring.privateKeys.importKey(freshKeys.privateKeyArmored);
				keyring.store();

				var pub = openpgp.key.readArmored(freshKeys.publicKeyArmored).keys[0],
					prv = openpgp.key.readArmored(freshKeys.privateKeyArmored).keys[0];

				$rootScope.$broadcast('crypto-dst-emails-updated', self.getAvailableDestinationEmails());
				$rootScope.$broadcast('crypto-src-emails-updated', self.getAvailableSourceEmails());

				deferred.resolve({
					pub: pub,
					prv: prv
				});
			})
			.catch(error =>{
				deferred.reject(error);
			});

		return deferred.promise;
	};

	var persistKey = (privateKey, storage = 'local', isDecrypted = false) => {
		var newKeyArmored = privateKey.armor();

		if (storage == 'local') {
			var selectedKeyring = isDecrypted ? localKeyring : keyring;

			var i = selectedKeyring.privateKeys.findIndexByFingerprint(privateKey.primaryKey.fingerprint);
			selectedKeyring.privateKeys.keys.splice(i, 1);

			selectedKeyring.privateKeys.importKey(newKeyArmored);
			selectedKeyring.store();
		} else {
			sessionKeyring.privateKeys.importKey(newKeyArmored);
			sessionKeyring.store();
		}
	};

	this.changePassword = (privateKey, newPassword, storage = 'local') => {
		try {
			if (!privateKey.primaryKey.isDecrypted) {
				privateKey = sessionKeyring.privateKeys.findByFingerprint(privateKey.primaryKey.fingerprint);
				privateKey.decrypt();
			}

			if (!privateKey || !privateKey.primaryKey.isDecrypted)
				return false;

			var packets = privateKey.getAllKeyPackets();
			packets.forEach(packet => packet.encrypt(newPassword));

			persistKey(privateKey, storage, !newPassword);

			return true;
		} catch (catchedError) {
			console.error(catchedError);
			return false;
		}
	};

	this.authenticateDefault = (password) => {
		var decryptedFingerprints = [];
		var failedFingerprints = [];
		keyring.privateKeys.keys.forEach(privateKey => {
			if (self.authenticate(privateKey, password))
				decryptedFingerprints.push(privateKey.primaryKey.fingerprint);
			else
				failedFingerprints.push(privateKey.primaryKey.fingerprint);
		});

		return {
			decryptedFingerprints: decryptedFingerprints,
			failedFingerprints: failedFingerprints
		};
	};

	this.authenticate = (privateKey, password) => {
		if (!applyPasswordToKeyPair(privateKey, password))
			return false;

		self.changePassword(privateKey, '', self.options.isPrivateComputer ? 'local' : 'session');

		return true;
	};

	this.decodeByListedFingerprints = (message, fingerprints) => {
		var deferred = $q.defer();

		try {
			var pgpMessage = openpgp.message.readArmored(message);

			var privateKey = fingerprints.reduce((a, fingerprint) => {
				var privateKey = keyring.privateKeys.findByFingerprint(fingerprint);

				if (!privateKey || !privateKey.primaryKey.isDecrypted)
					privateKey = sessionKeyring.privateKeys.findByFingerprint(fingerprint);

				if (!privateKey || !privateKey.primaryKey.isDecrypted)
					privateKey = localKeyring.privateKeys.findByFingerprint(fingerprint);

				if (privateKey && privateKey.primaryKey.isDecrypted)
					return privateKey;
			}, {});

			if (!privateKey)
				deferred.reject(new Error('No decrypted private key found!'));

			openpgp.decryptMessage(privateKey, pgpMessage)
				.then(plainText => {
					deferred.resolve(plainText);
				})
				.catch(error => {
					deferred.reject(error);
				});
		} catch (catchedError) {
			deferred.reject(catchedError);
		}

		return deferred.promise;
	};

	this.encodeWithKey = (email, message, publicKey) => {
		var deferred = $q.defer();

		try {
			publicKey = openpgp.key.readArmored(publicKey).keys[0];

			openpgp.encryptMessage(publicKey, message)
				.then(pgpMessage => {
					deferred.resolve(pgpMessage);
				})
				.catch(error => {
					deferred.reject(error);
				});
		} catch (catchedError) {
			deferred.reject(catchedError);
		}

		return deferred.promise;
	};
});