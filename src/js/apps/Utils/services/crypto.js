module.exports = /*@ngInject*/function($q, $rootScope, consts, co) {
	let self = this;

	let wrapOpenpgpKeyring = (keyring) => {
		let findByFingerprint = (keys, fingerprint) => {
			return keys.find(k => k.primaryKey.fingerprint == fingerprint);
		};

		let findIndexByFingerprint = (keys, fingerprint) => {
			return keys.findIndex(k => k.primaryKey.fingerprint == fingerprint);
		};

		keyring.publicKeys.findByFingerprint = (fingerprint) => findByFingerprint(keyring.publicKeys.keys, fingerprint);
		keyring.privateKeys.findByFingerprint = (fingerprint) => findByFingerprint(keyring.privateKeys.keys, fingerprint);

		keyring.publicKeys.findIndexByFingerprint = (fingerprint) => findIndexByFingerprint(keyring.publicKeys.keys, fingerprint);
		keyring.privateKeys.findIndexByFingerprint = (fingerprint) => findIndexByFingerprint(keyring.privateKeys.keys, fingerprint);

		return keyring;
	};

	let keyring = null, localKeyring = null, sessionKeyring = null;

	this.options = {};

	let getAvailableEmails = (keys) => Object.keys(keys.keys.reduce((a, k) => {
		let email = k.users[0].userId.userid.match(/<([^>]+)>/)[1];
		a[email] = true;
		return a;
	}, {}));

	let isInitialized = false;

	let applyPasswordToKeyPair = (privateKey, password) => {
		try {
			return privateKey.decrypt(password);
		} catch (catchedError) {
			console.error(catchedError);
			return false;
		}
	};

	let persistKey = (privateKey, storage = 'local', isDecrypted = false) => {
		let newKeyArmored = privateKey.armor();

		if (storage == 'local') {
			let selectedKeyring = isDecrypted ? localKeyring : keyring;

			let i = selectedKeyring.privateKeys.findIndexByFingerprint(privateKey.primaryKey.fingerprint);
			if (i > -1)
				selectedKeyring.privateKeys.keys.splice(i, 1);

			selectedKeyring.privateKeys.importKey(newKeyArmored);
			selectedKeyring.store();
		} else {
			sessionKeyring.privateKeys.importKey(newKeyArmored);
			sessionKeyring.store();
		}
	};

	this.decodeByListedFingerprints = (message, fingerprints) => co(function *(){
		let pgpMessage = openpgp.message.readArmored(message);

		let privateKeys = fingerprints
			.map((fingerprint) => {
				let privateKey = keyring.privateKeys.findByFingerprint(fingerprint);

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
		let mergedPublicKeys = publicKeys.reduce((a, k) => {
			a = a.concat(openpgp.key.readArmored(k).keys);
			return a;
		}, []);

		return {
			pgpData: yield openpgp.encryptMessage(mergedPublicKeys, message),
			mergedPublicKeys: mergedPublicKeys
		};
	});

	this.getAvailableSourceEmails = () => getAvailableEmails(keyring.privateKeys);

	this.getAvailableEncryptedPrivateKeys = () => {
		return keyring.privateKeys.keys;
	};

	this.getAvailableEncryptedPrivateKeysForEmail = (email) => {
		return keyring.privateKeys.getForAddress(email);
	};

	this.getAvailablePublicKeysForEmail = (email) => {
		return keyring.publicKeys.getForAddress(email);
	};

	this.getDecryptedPrivateKeyByFingerprint = (fingerprint) => {
		let k = localKeyring.privateKeys.findByFingerprint(fingerprint);
		if (k)
			return k;

		k = sessionKeyring.privateKeys.findByFingerprint(fingerprint);
		if (k)
			return k;

		return keyring.privateKeys.findByFingerprint(fingerprint);
	};

	this.importPublicKey = (publicKey) => {
		keyring.publicKeys.importKey(publicKey);
	};

	this.importPrivateKey = (privateKey) => {
		keyring.privateKeys.importKey(privateKey);
	};

	this.storeKeyring = () => {
		keyring.store();
	};

	this.initialize = (opt = {}) => {
		if (!opt.isPrivateComputer)
			opt.isPrivateComputer = false;

		self.options = opt;

		if (!isInitialized) {
			openpgp.initWorker('/vendor/openpgp.worker.js');

			isInitialized = true;
		}

		let sessionDecryptedStore = new openpgp.Keyring.localstore();
		sessionDecryptedStore.storage = window.sessionStorage;
		let localDecryptedStore = new openpgp.Keyring.localstore('openpgp-decrypted-');

		keyring = wrapOpenpgpKeyring(new openpgp.Keyring());
		localKeyring = wrapOpenpgpKeyring(new openpgp.Keyring(localDecryptedStore));
		sessionKeyring = wrapOpenpgpKeyring(new openpgp.Keyring(sessionDecryptedStore));

		$rootScope.$broadcast('keyring-updated');
	};

	this.generateKeys = (nameEmail, password, numBits) => {
		if (!numBits)
			numBits = consts.DEFAULT_KEY_LENGTH;

		console.log('generating keys', nameEmail, password, numBits);

		return co(function *(){
			let freshKeys = yield openpgp.generateKeyPair({numBits: numBits, userId: nameEmail, passphrase: password});

			keyring.publicKeys.importKey(freshKeys.publicKeyArmored);
			keyring.privateKeys.importKey(freshKeys.privateKeyArmored);
			keyring.store();

			return {
				pub: openpgp.key.readArmored(freshKeys.publicKeyArmored).keys[0],
				prv: openpgp.key.readArmored(freshKeys.privateKeyArmored).keys[0]
			};
		});
	};

	this.changePassword = (privateKey, newPassword, storage = 'local') => {
		try {
			if (!privateKey.primaryKey.isDecrypted) {
				privateKey = sessionKeyring.privateKeys.findByFingerprint(privateKey.primaryKey.fingerprint);
				privateKey.decrypt();
			}

			if (!privateKey || !privateKey.primaryKey.isDecrypted)
				return false;

			let packets = privateKey.getAllKeyPackets();
			packets.forEach(packet => packet.encrypt(newPassword));

			persistKey(privateKey, storage, !newPassword);

			return true;
		} catch (catchedError) {
			console.error(catchedError);
			return false;
		}
	};

	this.authenticateByEmail = (email, password) => {
		let decryptedFingerprints = [];
		let failedFingerprints = [];

		keyring.privateKeys.getForAddress(email).forEach(privateKey => {
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

	this.encodeEnvelopeWithKeys = (data, publicKeys, dataFieldName = 'data', prefixName = '') => co(function *(){
		if (!data.encoding)
			data.encoding = 'raw';
		if (!data.majorVersion)
			data.majorVersion = consts.ENVELOPE_DEFAULT_MAJOR_VERSION;
		if (!data.minorVersion)
			data.minorVersion = consts.ENVELOPE_DEFAULT_MINOR_VERSION;

		if (prefixName)
			prefixName = `${prefixName}_`;

		let dataObj = data.encoding == 'json' ? JSON.stringify(data.data) : data.data;
		let {pgpData, mergedPublicKeys} = yield self.encodeWithKeys(dataObj, publicKeys);

		let envelope = {
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

		let pgpData = envelope.data;
		let message = null;
		let state = 'ok';

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

	this.removeKeys = () => {
		let removeAll = (storage) => {
			delete storage['openpgp-private-keys'];
			delete storage['openpgp-public-keys'];
			delete storage['openpgp-decrypted-private-keys'];
			delete storage['openpgp-decrypted-public-keys'];
		};

		removeAll(localStorage);
		removeAll(sessionStorage);
	};
};