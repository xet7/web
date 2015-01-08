angular.module('AppLavaboomLogin').service('crypto', function($q, $base64) {
	var self = this;

	var wrapOpenpgpKeyring = (keyring) => {
		var findByFingerprint = (keys, fingerprint) => {
			for(var i = 0; i < keys.length; i++)
				if (keys[i].primaryKey.fingerprint == fingerprint)
					return keys[i];
			return null;
		};

		keyring.publicKeys.findByFingerprint = (fingerprint) => findByFingerprint(keyring.publicKeys.keys, fingerprint);
		keyring.privateKeys.findByFingerprint = (fingerprint) => findByFingerprint(keyring.privateKeys.keys, fingerprint);

		return keyring;
	};

	var sessionStore = new openpgp.Keyring.localstore();
	sessionStore.storage = window.sessionStorage;

	var keyring = window.keyring = wrapOpenpgpKeyring(new openpgp.Keyring());
	var sessionKeyring = window.sessionKeyring = wrapOpenpgpKeyring(new openpgp.Keyring(sessionStore));

	this.keyPairs = null;
	this.sessionKeyPairs = null;
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
		self.keyPairs = getKeyPairsFromKeyring(keyring);
		self.sessionKeyPairs = getKeyPairsFromKeyring(sessionKeyring);

		return self.keyPairs;
	};

	var applyPasswordToKeyPair = (privateKey, password) => {
		try {
			return privateKey.decrypt(password);
		} catch (catchedError) {
			console.error(catchedError);
			return false;
		}
	};

	var getKeyPairsFromKeyring = (keyring, email = null) => {
		var keys = keyring.getAllKeys();

		if (email)
			keys = keys.filter(key => key.users[0].userId.userid == email);

		var keyPairs = keys.reduce((keyPairs, key) => {
				if (!keyPairs[key.primaryKey.fingerprint])
					keyPairs[key.primaryKey.fingerprint] = {primaryKey: key.primaryKey};

				if (key.isPublic())
					keyPairs[key.primaryKey.fingerprint].pub = key;
				else
					keyPairs[key.primaryKey.fingerprint].prv = key;
				return keyPairs;
			}, {});

		/*Object.keys(keyPairs).forEach(fingerprint => {
			var status = keyPairs[fingerprint].prv.verifyPrimaryKey();
			var statusText = Object.keys(openpgp.enums.keyStatus).filter(k => openpgp.enums.keyStatus[k] == status);
			keyPairs[fingerprint].verificationStatus = statusText.length > 0 ? statusText[0] : 'undefined';
		});*/

		return keyPairs;
	};

	var getTheLatestPublicKeyForUser = (email) => {
		return keyring.publicKeys.getForAddress(email).reduce((a, k) => {
			if (!a || k.primaryKey.created > a.primaryKey.created)
				a = k;
			return a;
		}, null);
	};

	this.exportKeys = () => {

	};

	this.importKeys = () => {

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

				self.keyPairs = getKeyPairsFromKeyring(keyring);

				var pub = openpgp.key.readArmored(freshKeys.publicKeyArmored).keys[0],
					prv = openpgp.key.readArmored(freshKeys.privateKeyArmored).keys[0];

				deferred.resolve({
					primaryKey: prv.primaryKey,
					pub: pub,
					prv: prv
				});
			})
			.catch(error =>{
				deferred.reject(error);
			});

		return deferred.promise;
	};

	this.changePassword = (privateKey, oldPassword, newPassword, persist = 'local') => {
		try {
			if (!privateKey.decrypt(oldPassword))
				return false;

			var packets = privateKey.getAllKeyPackets();
			packets.forEach(packet => packet.encrypt(newPassword));
			var newKeyArmored = privateKey.armor();

			if (persist == 'local') {
				keyring.privateKeys.importKey(newKeyArmored);
				keyring.store();
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
		console.log(self.options.isRememberPasswords);
		return (self.options.isRememberPasswords ?
			self.changePassword(privateKey, password, '', 'session')
			: applyPasswordToKeyPair(privateKey, password));
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

			var decryptedPrivateKeys = sessionKeyring.privateKeys.getForAddress(email);
			var t = decryptedPrivateKeys.length;
			if (t < 1)
				deferred.reject(new Error('Cannot find private key to decrypt email!'));
			else {
				for (var i = 0; i < decryptedPrivateKeys.length; i++) {
					var privateKey = decryptedPrivateKeys[i];

					openpgp.decryptMessage(privateKey, pgpMessage)
						.then(plainText => {
							isDecrypted = true;
							deferred.resolve(plainText);
						})
						.catch(error => {
							t--;
							lastError = error;
							if (!isDecrypted && t < 1)
								deferred.reject(new Error('Cannot find private key to decrypt email!'));
						});
				}
			}
		} catch (catchedError) {
			deferred.reject(catchedError);
		}

		return deferred.promise;
	};
});