angular.module('AppLavaboomLogin').service('crypto', function($q, $base64) {
	var self = this;

	var keyring = new openpgp.Keyring();
	this.keyPairs = null;

	this.initialize = () => {
		openpgp.initWorker('/vendor/openpgp.worker.js');
		self.keyPairs = self.getKeyPairs();

		return self.keyPairs;
	};

	this.getKeyPairs = (email = null) => {
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

		Object.keys(keyPairs).forEach(fingerprint => {
			var status = keyPairs[fingerprint].prv.verifyPrimaryKey();
			var statusText = Object.keys(openpgp.enums.keyStatus).filter(k => openpgp.enums.keyStatus[k] == status);
			keyPairs[fingerprint].verificationStatus = statusText.length > 0 ? statusText[0] : 'undefined';
		});

		return keyPairs;
	};

	this.getActiveKeyPairForUser = (email) => {
		var keyPairs = self.getKeyPairs(email);

		return Object.keys(keyPairs).reduce((a, keyFingerprint) => {
			var key = keyPairs[keyFingerprint];
			if (!a || key.primaryKey.created > a.primaryKey.created)
				a = key;
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

				self.keyPairs = self.getKeyPairs();

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

	this.authenticate = (primaryKeyFingerprint, password) => {
		var privateKey = null;

		try {
			if (!self.keyPairs[primaryKeyFingerprint])
				throw new Error(`Can't find key with fingerprint '${primaryKeyFingerprint}'`);

			privateKey = self.keyPairs[primaryKeyFingerprint].prv;
			privateKey.decrypt(password);
		} catch (catchedError) {
			console.error(catchedError);
			return false;
		}

		return privateKey.primaryKey.isDecrypted;
	};

	this.encode = (primaryKeyFingerprint, message) => {
		var deferred = $q.defer();

		try {
			if (!self.keyPairs[primaryKeyFingerprint])
				throw new Error(`Can't find key with fingerprint '${primaryKeyFingerprint}'`);

			var publicKey = self.keyPairs[primaryKeyFingerprint].pub;
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

	this.decode = (primaryKeyFingerprint, message) => {
		var deferred = $q.defer();

		try {
			if (!self.keyPairs[primaryKeyFingerprint])
				throw new Error(`Can't find key with fingerprint '${primaryKeyFingerprint}'`);

			var privateKey = self.keyPairs[primaryKeyFingerprint].prv;

			var pgpMessage = openpgp.message.readArmored(message);
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
});
