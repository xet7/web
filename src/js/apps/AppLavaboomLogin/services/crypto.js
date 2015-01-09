angular.module('AppLavaboomLogin').service('crypto', function($q, $rootScope) {
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

	var sessionStore = new openpgp.Keyring.localstore();
	sessionStore.storage = window.sessionStorage;

	var keyring = window.keyring = wrapOpenpgpKeyring(new openpgp.Keyring());
	var sessionKeyring = window.sessionKeyring = wrapOpenpgpKeyring(new openpgp.Keyring(sessionStore));

	this.options = {};

	var getAvailableEmails = (keys) => Object.keys(keys.keys.reduce((a, k) => {
		var email = k.users[0].userId.userid.match(/<([^>]+)>/)[1];
		a[email] = true;
		return a;
	}, {}));

	this.getAvailablePrivateKeys = () => keyring.privateKeys;

	this.getAvailablePrivateDecryptedKeys = () => sessionKeyring.privateKeys;

	this.getAvailableDestinationEmails = () => getAvailableEmails(keyring.publicKeys);

	this.getAvailableSourceEmails = () => getAvailableEmails(keyring.privateKeys);

	this.initialize = (opt = {}) => {
		if (!opt.isRememberPasswords)
			opt.isRememberPasswords = false;

		self.options = opt;

		openpgp.initWorker('/vendor/openpgp.worker.js');
	};

	var applyPasswordToKeyPair = (privateKey, password) => {
		try {
			return privateKey.decrypt(password);
		} catch (catchedError) {
			console.error(catchedError);
			return false;
		}
	};

	var getTheLatestPublicKeyForUser = (email) => {
		return keyring.publicKeys.getForAddress(email).reduce((a, k) => {
			if (!a || k.primaryKey.created > a.primaryKey.created)
				a = k;
			return a;
		}, null);
	};

	this.generateKeys = (email, password, numBits) => {
		if (!numBits)
			numBits = 1024;

		var deferred = $q.defer();
		openpgp.generateKeyPair({numBits: numBits, userId: email, passphrase: password})
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

	this.changePassword = (privateKey, newPassword, persist = 'local') => {
		try {
			var origPrivateKey = privateKey;
			if (!privateKey.primaryKey.isDecrypted) {
				privateKey = sessionKeyring.privateKeys.findByFingerprint(privateKey.primaryKey.fingerprint);
				privateKey.decrypt();
			}

			if (!privateKey || !privateKey.primaryKey.isDecrypted)
				return false;

			var packets = privateKey.getAllKeyPackets();
			packets.forEach(packet => packet.encrypt(newPassword));
			var newKeyArmored = privateKey.armor();

			if (persist == 'local') {
				var i = keyring.privateKeys.findIndexByFingerprint(origPrivateKey.primaryKey.fingerprint);
				keyring.privateKeys.keys.splice(i, 1);

				keyring.privateKeys.importKey(newKeyArmored);
				keyring.store();

				i = sessionKeyring.privateKeys.findIndexByFingerprint(origPrivateKey.primaryKey.fingerprint);
				sessionKeyring.privateKeys.keys.splice(i, 1);

				sessionKeyring.privateKeys.importKey(newKeyArmored);
				sessionKeyring.store();
			} else {
				sessionKeyring.privateKeys.importKey(newKeyArmored);
				sessionKeyring.store();
			}

			return true;
		} catch (catchedError) {
			console.error(catchedError);
			return false;
		}
	};

	this.authenticate = (privateKey, password) => {
		if (!applyPasswordToKeyPair(privateKey, password))
			return false;

		if (self.options.isRememberPasswords) {
			self.changePassword(privateKey, '', 'session');
		}

		return true;
	};

	this.encode = (email, message) => {
		var deferred = $q.defer();

		try {
			var publicKey = getTheLatestPublicKeyForUser(email);

			if (!publicKey)
				throw new Error(`Can't find public key for user with email '${email}'`);

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

	this.decode = (email, message) => {
		var deferred = $q.defer();

		try {
			var isDecrypted = true;
			var lastError = null;
			var pgpMessage = openpgp.message.readArmored(message);

			var privateKeys = keyring.privateKeys.getForAddress(email);
			var decryptedPrivateKeys = sessionKeyring.privateKeys;

			if (privateKeys.length < 1)
				deferred.reject(new Error('No private keys found!'));
			else {
				var t = privateKeys.length;
				var decryptCallChain = [];

				for (var i = 0; i < privateKeys.length; i++) {
					var privateKey = privateKeys[i];
					if (!privateKey.primaryKey.isDecrypted)
						privateKey = decryptedPrivateKeys.findByFingerprint(privateKey.primaryKey.fingerprint);

					if (privateKey && privateKey.primaryKey.isDecrypted)
						((privateKey) => {
							decryptCallChain.push(() => {
								openpgp.decryptMessage(privateKey, pgpMessage)
									.then(plainText => {
										isDecrypted = true;
										deferred.resolve(plainText);
									})
									.catch(error => {
										t--;
										lastError = error;
										if (!isDecrypted && t < 1) {
											deferred.reject(new Error('Cannot find private key to decrypt email!'));
										}
									});
							});
						})(privateKey);
					else
						t--;
				}

				decryptCallChain.forEach(decrypt => decrypt());

				if (decryptCallChain < 0)
					deferred.reject(new Error('Please decrypt at least one your private key!'));
			}
		} catch (catchedError) {
			deferred.reject(catchedError);
		}

		return deferred.promise;
	};
});