module.exports = /*@ngInject*/function($q, $rootScope, consts, co, utils, CryptoKeysStorage) {
	const self = this;

	let storage = null;
	let keyring = null;
	let isInitialized = false;

	const defaultOptions = {
		isPrivateComputer: false
	};

	const wrapOpenpgpKeyring = (keyring) => {
		const findByFingerprint = (keys, fingerprint) => keys.find(k => k.primaryKey.fingerprint == fingerprint);

		const findIndexByFingerprint = (keys, fingerprint) => keys.findIndex(k => k.primaryKey.fingerprint == fingerprint);

		keyring.publicKeys.findByFingerprint = (fingerprint) => findByFingerprint(keyring.publicKeys.keys, fingerprint);
		keyring.privateKeys.findByFingerprint = (fingerprint) => findByFingerprint(keyring.privateKeys.keys, fingerprint);

		keyring.publicKeys.findIndexByFingerprint = (fingerprint) => findIndexByFingerprint(keyring.publicKeys.keys, fingerprint);
		keyring.privateKeys.findIndexByFingerprint = (fingerprint) => findIndexByFingerprint(keyring.privateKeys.keys, fingerprint);

		return keyring;
	};

	const changePasswordForPrivateKey = (privateKey, newPassword) => {
		try {
			if (!privateKey || !privateKey.primaryKey.isDecrypted)
				return null;

			const packets = privateKey.getAllKeyPackets();
			packets.forEach(packet => packet.encrypt(newPassword));

			const i = keyring.privateKeys.findIndexByFingerprint(privateKey.primaryKey.fingerprint);
			if (i > -1) {
				const updatedPrivateKey = openpgp.key.readArmored(privateKey.armor()).keys[0];
				keyring.privateKeys.keys[i] = updatedPrivateKey;
				return updatedPrivateKey;
			}

			return null;
		} catch (catchedError) {
			console.error(catchedError);
			return null;
		}
	};

	const applyPasswordToKeyPair = (privateKey, password) => {
		if (privateKey.primaryKey.isDecrypted)
			return true;

		try {
			return privateKey.decrypt(password);
		} catch (catchedError) {
			console.error(catchedError);
			return false;
		}
	};

	const getDecryptedPrivateKeys = () => keyring.privateKeys.keys.filter(k => k.primaryKey.isDecrypted);

	const authenticate = (privateKey, password, isPersist = false) => {
		if (!applyPasswordToKeyPair(privateKey, password))
			return false;

		const updatedPrivateKey = changePasswordForPrivateKey(privateKey, '');
		if (isPersist && updatedPrivateKey)
			self.importPrivateKey(updatedPrivateKey);

		return true;
	};

	this.options = {};

	this.decodeRaw = (message) => co(function *(){
		if (!message)
			throw new Error('nothing_to_decrypt');

		const pgpMessage = openpgp.message.readArmored(message);

		const decryptResults = yield getDecryptedPrivateKeys().map(key => {
			return co.def(openpgp.decryptMessage(key, pgpMessage), null);
		});

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

	this.getAvailableSourceEmails = () => utils.uniqMap(keyring.privateKeys.keys,
		k => utils.getEmailFromAddressString(k.users[0].userId.userid));

	this.getAvailablePrivateKeys = () => keyring.privateKeys.keys;

	this.getAvailablePublicKeysForEmail = (email) => keyring.publicKeys.getForAddress(email);

	this.getPublicKeyByFingerprint = (fingerprint) => keyring.publicKeys.findByFingerprint(fingerprint);

	this.getPrivateKeyByFingerprint = (fingerprint) => keyring.privateKeys.findByFingerprint(fingerprint);

	this.readKey = (key) => {
		return openpgp.key.readArmored(key).keys[0];
	};

	this.importPublicKey = (publicKey) => {
		console.log('importing public key', publicKey);

		if (!publicKey)
			return;

		keyring.publicKeys.importKey(publicKey.armor ? publicKey.armor() : publicKey);
		keyring.store();
	};

	this.importPrivateKey = (privateKeySubst) => {
		console.log('importing private key', privateKeySubst);

		if (!privateKeySubst)
			return;

		let [privateKeys, privateKeyArmored] = privateKeySubst.armor
			? [[privateKeySubst], privateKeySubst.armor()]
			: [openpgp.key.readArmored(privateKeySubst).keys, privateKeySubst];

		for(let privateKey of privateKeys) {
			const i = keyring.privateKeys.findIndexByFingerprint(privateKey.primaryKey.fingerprint);
			if (i > -1) {
				console.log('remove existing private key with fingerprint', privateKey.primaryKey.fingerprint, 'index', i);
				keyring.privateKeys.keys.splice(i, 1);
			}
		}

		keyring.privateKeys.importKey(privateKeyArmored);
		keyring.store();
	};

	this.initialize = (opt = {}) => {
		const storedOptions = utils.def(() => JSON.parse(localStorage['lava-crypto-options']), {});
		self.options = angular.extend({}, defaultOptions, storedOptions, opt);
		localStorage['lava-crypto-options'] = JSON.stringify(self.options);

		if (!isInitialized) {
			const threadsCount = navigator.hardwareConcurrency ? navigator.hardwareConcurrency : consts.CRYPTO_DEFAULT_THREAD_POOL_SIZE;

			console.log('Initialize openpgp in multi-threading mode, workers count: ', threadsCount);
			openpgp.initWorker('/vendor/openpgp.worker.js', {threadsCount: threadsCount});
			isInitialized = true;
		}

		storage = new CryptoKeysStorage(self.options.isPrivateComputer);
		keyring = wrapOpenpgpKeyring(new openpgp.Keyring(storage));
		window.keyring = keyring;

		$rootScope.$broadcast('keyring-updated');
	};

	this.createKeyring = (isLoadDecrypted = true) => {
		const storage = new CryptoKeysStorage(self.options.isPrivateComputer, isLoadDecrypted);
		return wrapOpenpgpKeyring(new openpgp.Keyring(storage));
	};

	this.generateKeys = (nameEmail, password, numBits) => {
		if (!numBits)
			numBits = consts.DEFAULT_KEY_LENGTH;

		console.log('generating keys 2', nameEmail, password, numBits);

		console.log('before return co(function *(){');
		return co(function *(){
			console.log('before yield openpgp.generateKeyPair');
			const freshKeys = yield openpgp.generateKeyPair({numBits: numBits, userId: nameEmail, passphrase: password});

			console.log('keys generated', freshKeys);

			const publicKey = openpgp.key.readArmored(freshKeys.publicKeyArmored).keys[0];
			const privateKey = openpgp.key.readArmored(freshKeys.privateKeyArmored).keys[0];

			self.importPublicKey(publicKey);
			self.importPrivateKey(privateKey);

			return {
				pub: publicKey,
				prv: privateKey
			};
		});
	};

	this.changePassword = (email, oldPassword, newPassword) => {
		const privateKeys = keyring.privateKeys.getForAddress(email);
		privateKeys.forEach(privateKey => {
			if (authenticate(privateKey, oldPassword)) {
				const updatedPrivateKey = changePasswordForPrivateKey(privateKey, newPassword);
				if (updatedPrivateKey) {
					self.importPrivateKey(updatedPrivateKey);

					authenticate(updatedPrivateKey, newPassword);
				}
			}
		});
	};

	this.authenticateByEmail = (email, password) => {
		const decryptedFingerprints = [];
		const failedFingerprints = [];

		keyring.privateKeys.getForAddress(email).forEach(privateKey => {
			if (authenticate(privateKey, password, true)) {
				decryptedFingerprints.push(privateKey.primaryKey.fingerprint);
			} else
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
		if (!authenticate(privateKey, password, true))
			return false;

		$rootScope.$broadcast('keyring-updated');

		return true;
	};

	this.hash = (data) => openpgp.util.hexstrdump(openpgp.crypto.hash.sha256(data));

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
		storage.clearAllKeys();
	};

	this.removeSensitiveKeys = (isTriggerUpdateEvent = false) => {
		storage.clearDecryptedPrivateKeys();

		if (isTriggerUpdateEvent)
			self.initialize();
	};
};