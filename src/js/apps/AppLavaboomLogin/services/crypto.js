angular.module('AppLavaboomLogin').service('crypto', function($q, $base64) {
	var self = this;

	var keyring = new openpgp.Keyring();
	window.keyring = keyring;
	console.log('crypto svc started...');

	this.initialize = () => {
		openpgp.initWorker('/vendor/openpgp.worker.js');
		console.log('crypto svc initialized, keyring is:', keyring);
	};

	this.verifyKeys = () => {
		var invalidKeys = [];
		var validKeys = [];

		keyring.getAllKeys().forEach(key => {
			var status = key.verifyPrimaryKey();
			if (status != openpgp.enums.keyStatus.valid)
				invalidKeys.push({
					key: key,
					status: status
				});
			else
				validKeys.push({
					key: key,
					status: status
				});
		});

		return {
			invalidKeys: invalidKeys,
			validKeys: validKeys
		};
	};

	this.getKeyPairs = (email = null) => {
		var keys = keyring.getAllKeys();

		if (email)
			keys = keys.filter(key => key.users[0].userId.userid == email);

		return keys.reduce((keyPairs, key) => {
				if (!keyPairs[key.primaryKey.fingerprint])
					keyPairs[key.primaryKey.fingerprint] = {primaryKey: key.primaryKey};

				if (key.isPublic())
					keyPairs[key.primaryKey.fingerprint].pub = key;
				else
					keyPairs[key.primaryKey.fingerprint].prv = key;
				return keyPairs;
			}, {});
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

	this.saveKeys = () => {

	};

	this.loadKeys = () => {

	};

	this.authenticate = (privateKey, password) => {
		privateKey.decrypt(password);

		console.log('pk decrypted', privateKey);
	};

	this.generateOpenpgpKeys = (email, password, numBits) => {
		if (!numBits)
			numBits = 1024;

		var deferred = $q.defer();
		openpgp.generateKeyPair({numBits: numBits, userId: email, passphrase: password})
			.then(freshKeys => {
				keyring.publicKeys.importKey(freshKeys.publicKeyArmored);
				keyring.privateKeys.importKey(freshKeys.privateKeyArmored);
				keyring.store();
				deferred.resolve(freshKeys);
			})
			.catch(error =>{
				deferred.reject(error);
			});

		return deferred.promise;
	};

	this.encode = (publicKey, message) => {
		var deferred = $q.defer();

		openpgp.encryptMessage(publicKey, message)
			.then(pgpMessage => {
				deferred.resolve(pgpMessage);
			})
			.catch(error => {
				deferred.reject(error);
			});

		return deferred.promise;
	};

	this.decode = (privateKey, message) => {
		var deferred = $q.defer();

		var pgpMessage = openpgp.message.readArmored(message);
		openpgp.decryptMessage(privateKey, pgpMessage)
			.then(plainText => {
				deferred.resolve(plainText);
			})
			.catch(error => {
				deferred.reject(error);
			});

		return deferred.promise;
	};
});
