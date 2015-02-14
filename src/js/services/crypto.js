module.exports = /*@ngInject*/function($q, $rootScope, consts, co) {
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

	this.getPrivateKeyByFingerprint = (fingerprint) => {
		var k = localKeyring.privateKeys.findByFingerprint(fingerprint);
		if (k)
			return k;

		k = sessionKeyring.privateKeys.findByFingerprint(fingerprint);
		if (k)
			return k;

		return keyring.privateKeys.findByFingerprint(fingerprint);
	};

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

		return co(function *(){
			var freshKeys = yield openpgp.generateKeyPair({numBits: numBits, userId: nameEmail, passphrase: password});

			keyring.publicKeys.importKey(freshKeys.publicKeyArmored);
			keyring.privateKeys.importKey(freshKeys.privateKeyArmored);
			keyring.store();

			var pub = openpgp.key.readArmored(freshKeys.publicKeyArmored).keys[0],
				prv = openpgp.key.readArmored(freshKeys.privateKeyArmored).keys[0];

			$rootScope.$broadcast('crypto-dst-emails-updated', self.getAvailableDestinationEmails());
			$rootScope.$broadcast('crypto-src-emails-updated', self.getAvailableSourceEmails());

			return {
				pub: pub,
				prv: prv
			};
		});
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

	this.decodeByListedFingerprints = (message, fingerprints) => co(function *(){
		var pgpMessage = openpgp.message.readArmored(message);

		var privateKeys = fingerprints
			.map((fingerprint) => {
				var privateKey = keyring.privateKeys.findByFingerprint(fingerprint);

				if (!privateKey || !privateKey.primaryKey.isDecrypted)
					privateKey = sessionKeyring.privateKeys.findByFingerprint(fingerprint);

				if (!privateKey || !privateKey.primaryKey.isDecrypted)
					privateKey = localKeyring.privateKeys.findByFingerprint(fingerprint);

				if (privateKey && privateKey.primaryKey.isDecrypted)
					return privateKey;

				return null;
			}, {})
			.filter(k => k);

		if (!privateKeys || privateKeys.length < 1)
			throw new Error('no_private_key');

		return yield openpgp.decryptMessage(privateKeys[0], pgpMessage);
	});

	this.encodeWithKeys = (message, publicKeys) => co(function *(){
		console.log('encodeWithKeys, publicKeys', publicKeys);
		publicKeys = publicKeys.map(publicKey => openpgp.key.readArmored(publicKey).keys[0]);
		console.log('encodeWithKeys, publicKeys', publicKeys);

		return yield openpgp.encryptMessage(publicKeys, message);
	});

	this.encodeEnvelopeWithKeys = (data, publicKeys, dataFieldName = 'data', prefixName = '') => co(function *(){
		if (!data.encoding)
			data.encoding = 'raw';
		if (!data.majorVersion)
			data.majorVersion = consts.ENVELOPE_DEFAULT_MAJOR_VERSION;
		if (!data.minorVersion)
			data.minorVersion = consts.ENVELOPE_DEFAULT_MINOR_VERSION;

		if (prefixName)
			prefixName = `${prefixName}_`;

		var mergedPublicKeys = publicKeys.reduce((a, k) => {
			a = a.concat(openpgp.key.readArmored(k).keys);
			return a;
		}, []);

		var dataObj = data.encoding == 'json' ? JSON.stringify(data.data) : data.data;
		var pgpData = yield openpgp.encryptMessage(mergedPublicKeys, dataObj);

		var envelope = {
			pgp_fingerprints: mergedPublicKeys.map(k => k.primaryKey.fingerprint),
			encoding: data.encoding
		};

		envelope[dataFieldName] = pgpData;

		envelope[`${prefixName}version_major`] = data.majorVersion;
		envelope[`${prefixName}version_minor`] = data.minorVersion;

		return envelope;
	});

	this.decodeEnvelope = (envelope, prefixName = '', encoding = '') => co(function *(){
		if (prefixName)
			prefixName = `${prefixName}_`;
		if (encoding)
			envelope.encoding = encoding;

		var pgpData = envelope.data;
		var message = null;
		var state = 'ok';

		try {
			message = envelope.pgp_fingerprints && envelope.pgp_fingerprints.length > 0
				? yield self.decodeByListedFingerprints(pgpData, envelope.pgp_fingerprints)
				: pgpData;

			if (envelope.encoding == 'json')
				message = JSON.parse(message);
		} catch (error) {
			message = '';
			state = error.message;
			console.error('decodeEnvelope', error);
		}

		return {
			data: message,
			state: state,
			majorVersion: envelope[`${prefixName}version_major`],
			minorVersion: envelope[`${prefixName}version_minor`]
		};
	});
};