module.exports = /*@ngInject*/function($q, $rootScope, consts, co, utils) {
	const self = this;

	let keyring = null, localKeyring = null, sessionKeyring = null;
	let isInitialized = false;

	const wrapOpenpgpKeyring = (keyring) => {
		const findByFingerprint = (keys, fingerprint) => keys.find(k => k.primaryKey.fingerprint == fingerprint);

		const findIndexByFingerprint = (keys, fingerprint) => keys.findIndex(k => k.primaryKey.fingerprint == fingerprint);

		keyring.publicKeys.findByFingerprint = (fingerprint) => findByFingerprint(keyring.publicKeys.keys, fingerprint);
		keyring.privateKeys.findByFingerprint = (fingerprint) => findByFingerprint(keyring.privateKeys.keys, fingerprint);

		keyring.publicKeys.findIndexByFingerprint = (fingerprint) => findIndexByFingerprint(keyring.publicKeys.keys, fingerprint);
		keyring.privateKeys.findIndexByFingerprint = (fingerprint) => findIndexByFingerprint(keyring.privateKeys.keys, fingerprint);

		return keyring;
	};

	const getAvailableEmails = (keys) => Object.keys(keys.keys.reduce((a, k) => {
		const email = k.users[0].userId.userid.match(/<([^>]+)>/)[1];
		a[email] = true;
		return a;
	}, {}));

	const applyPasswordToKeyPair = (privateKey, password) => {
		try {
			return privateKey.decrypt(password);
		} catch (catchedError) {
			console.error(catchedError);
			return false;
		}
	};

	const persistKey = (privateKey, storage = 'local', isDecrypted = false) => {
		const newKeyArmored = privateKey.armor();

		if (storage == 'local') {
			const selectedKeyring = isDecrypted ? localKeyring : keyring;

			const i = selectedKeyring.privateKeys.findIndexByFingerprint(privateKey.primaryKey.fingerprint);
			if (i > -1)
				selectedKeyring.privateKeys.keys.splice(i, 1);

			selectedKeyring.privateKeys.importKey(newKeyArmored);
			selectedKeyring.store();
		} else {
			sessionKeyring.privateKeys.importKey(newKeyArmored);
			sessionKeyring.store();
		}
	};

	const getDecryptedPrivateKeys = () => {
		const keys = new Map();
		const getDecryptedKeysFromKeyring = (keyring) => keyring.privateKeys.keys.reduce((keys, k) => {
			if (k.primaryKey.isDecrypted)
				keys.set(k.primaryKey.fingerprint, k);
			return keys;
		}, keys);

		getDecryptedKeysFromKeyring(localKeyring);
		getDecryptedKeysFromKeyring(sessionKeyring);
		getDecryptedKeysFromKeyring(keyring);

		return [...keys.values()];
	};

	const authenticate = (privateKey, password) => {
		if (!applyPasswordToKeyPair(privateKey, password))
			return false;

		self.changePassword(privateKey, '');

		return true;
	};

	const removeEncryptedKeys = (storage) => {
		delete storage['openpgp-private-keys'];
		delete storage['openpgp-public-keys'];
	};

	const removeDecryptedKeys = (storage) => {
		delete storage['openpgp-decrypted-private-keys'];
		delete storage['openpgp-decrypted-public-keys'];
	};

	const removeKeys = (storage) => {
		removeEncryptedKeys(storage);
		removeDecryptedKeys(storage);
	};

	const getSecureStorageName = () => self.options.isPrivateComputer ? 'local' : 'session';

	this.options = {};

	this.decodeRaw = (message) => co(function *(){
		if (!message)
			throw new Error('nothing_to_decrypt');

		const pgpMessage = openpgp.message.readArmored(message);
		const decryptResults = yield getDecryptedPrivateKeys().map(key => co.def(openpgp.decryptMessage(key, pgpMessage), null));

		const r = decryptResults.find(r => r);
		if (!r)
			throw new Error('no_private_key');

		return r;
	});

	this.encodeWithKeys = (message, publicKeys) => co(function *(){
		const mergedPublicKeys = publicKeys.reduce((a, k) => {
			a = a.concat(openpgp.key.readArmored(k).keys);
			return a;
		}, []);

		return {
			pgpData: yield openpgp.encryptMessage(mergedPublicKeys, message),
			mergedPublicKeys: mergedPublicKeys
		};
	});

	this.getAvailableSourceEmails = () => getAvailableEmails(keyring.privateKeys);

	this.getAvailableEncryptedPrivateKeys = () => keyring.privateKeys.keys;

	this.getAvailableEncryptedPrivateKeysForEmail = (email) => keyring.privateKeys.getForAddress(email);

	this.getAvailablePublicKeysForEmail = (email) => keyring.publicKeys.getForAddress(email);

	this.getPublicKeyByFingerprint = (fingerprint) => keyring.publicKeys.findByFingerprint(fingerprint);

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
			openpgp.key.generate({numBits: 1024, userId: 'test@test', passphrase: 'test'}).catch(err => {
				console.error('!gg!', err);
			});

			openpgp.initWorker('/vendor/openpgp.worker.js');

			isInitialized = true;
		}

		const sessionDecryptedStore = new openpgp.Keyring.localstore();
		sessionDecryptedStore.storage = window.sessionStorage;
		const localDecryptedStore = new openpgp.Keyring.localstore('openpgp-decrypted-');

		keyring = wrapOpenpgpKeyring(new openpgp.Keyring());
		localKeyring = wrapOpenpgpKeyring(new openpgp.Keyring(localDecryptedStore));
		sessionKeyring = wrapOpenpgpKeyring(new openpgp.Keyring(sessionDecryptedStore));

		console.log('!broadcasting keyring-updated from crypto.initialize');
		$rootScope.$broadcast('keyring-updated');
	};

	this.generateKeys = (nameEmail, password, numBits) => {
		if (!numBits)
			numBits = consts.DEFAULT_KEY_LENGTH;

		console.log('generating keys', nameEmail, password, numBits);

		return co(function *(){
			const freshKeys = yield openpgp.generateKeyPair({numBits: numBits, userId: nameEmail, passphrase: password});

			console.log('keys generated', freshKeys);

			keyring.publicKeys.importKey(freshKeys.publicKeyArmored);
			keyring.privateKeys.importKey(freshKeys.privateKeyArmored);
			keyring.store();

			return {
				pub: openpgp.key.readArmored(freshKeys.publicKeyArmored).keys[0],
				prv: openpgp.key.readArmored(freshKeys.privateKeyArmored).keys[0]
			};
		});
	};

	this.changePassword = (privateKey, newPassword) => {
		const storage = getSecureStorageName();
		try {
			if (!privateKey.primaryKey.isDecrypted) {
				privateKey = sessionKeyring.privateKeys.findByFingerprint(privateKey.primaryKey.fingerprint);
				privateKey.decrypt();
			}

			if (!privateKey || !privateKey.primaryKey.isDecrypted)
				return false;

			const packets = privateKey.getAllKeyPackets();
			packets.forEach(packet => packet.encrypt(newPassword));

			persistKey(privateKey, storage, !newPassword);

			return true;
		} catch (catchedError) {
			console.error(catchedError);
			return false;
		}
	};

	this.authenticateByEmail = (email, password) => {
		const decryptedFingerprints = [];
		const failedFingerprints = [];

		keyring.privateKeys.getForAddress(email).forEach(privateKey => {
			if (authenticate(privateKey, password))
				decryptedFingerprints.push(privateKey.primaryKey.fingerprint);
			else
				failedFingerprints.push(privateKey.primaryKey.fingerprint);
		});

		if (decryptedFingerprints.length > 0)
			$rootScope.$broadcast('keyring-updated');

		return {
			decryptedFingerprints: decryptedFingerprints,
			failedFingerprints: failedFingerprints
		};
	};

	this.authenticate = (privateKey, password) => {
		if (!authenticate(privateKey, password))
			return false;

		$rootScope.$broadcast('keyring-updated');

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

		const dataObj = data.encoding == 'json' ? JSON.stringify(data.data) : data.data;
		const {pgpData, mergedPublicKeys} = publicKeys && publicKeys.length > 0
			? yield self.encodeWithKeys(dataObj, publicKeys)
			: {pgpData: dataObj, mergedPublicKeys: []};

		const envelope = {
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
			message = yield self.decodeRaw(pgpData);

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

	this.removeAllKeys = () => {
		removeKeys(localStorage);
		removeKeys(sessionStorage);
	};

	this.removeSensitiveKeys = (isTriggerUpdateEvent = false) => {
		removeDecryptedKeys(localStorage);
		removeKeys(sessionStorage);

		if (isTriggerUpdateEvent)
			self.initialize();
	};
};