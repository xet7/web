module.exports = function ($q, $rootScope, $filter, $translate, co, crypto, consts, utils) {
	const self = this;

	const translations = {
		BACKUP_WARNING_TEXT: ''
	};

	$translate.bindAsObject(translations, 'NOTIFICATIONS');

	this.verifyAndReadBackup = (jsonBackup) => {
		let importObj = null;
		let privateKeys = [];
		let publicKeys = [];

		try {
			importObj = JSON.parse(jsonBackup);
		} catch (error) {
			let keyring = openpgp.key.readArmored(jsonBackup);

			if (keyring.err && keyring.err.length > 0)
				throw new Error('WRONG_FORMAT');

			for (let key of keyring.keys) {
				if (key.primaryKey.tag == 5)
					privateKeys.push(key);
				else
				if (key.primaryKey.tag == 6)
					publicKeys.push(key);
				else
					throw new Error('UNEXPECTED_KEY_TYPE_FOUND');
			}

			return {
				prv: privateKeys,
				pub: publicKeys
			};
		}

		let bodyHash = utils.hexify(openpgp.crypto.hash.sha512(JSON.stringify(importObj.body)));
		if (bodyHash != importObj.bodyHash)
			throw new Error('CORRUPTED');

		Object.keys(importObj.body.key_pairs).forEach(email => {
			if (angular.isString(importObj.body.key_pairs[email].prv))
				importObj.body.key_pairs[email].prv = [importObj.body.key_pairs[email].prv];

			importObj.body.key_pairs[email].prv.forEach(privateKeyArmored => {
				for(let key of openpgp.key.readArmored(privateKeyArmored).keys) {
					if (key.primaryKey.tag != 5)
						throw new Error('CORRUPTED');

					privateKeys.push(key);
				}
			});

			if (angular.isString(importObj.body.key_pairs[email].pub))
				importObj.body.key_pairs[email].pub = [importObj.body.key_pairs[email].pub];

			importObj.body.key_pairs[email].pub.forEach(publicKeyArmored => {
				for(let key of openpgp.key.readArmored(publicKeyArmored).keys) {
					if (key.primaryKey.tag != 6)
						throw new Error('CORRUPTED');

					publicKeys.push(key);
				}
			});
		});

		return {
			prv: privateKeys,
			pub: publicKeys
		};
	};

	this.importKeys = (jsonBackup) => {
		let backup = self.verifyAndReadBackup(jsonBackup);

		for(let key of backup.prv)
			if (!crypto.getPrivateKeyByFingerprint(key.primaryKey.fingerprint))
				crypto.importPrivateKey(key);
			else
				console.log('skip private key import - already existing', key.primaryKey.fingerprint);

		for(let key of backup.pub)
			if (!crypto.getPublicKeyByFingerprint(key.primaryKey.fingerprint))
				crypto.importPublicKey(key);
			else
				console.log('skip public key import - already existing', key.primaryKey.fingerprint);

		crypto.storeKeyring();
		crypto.initialize();

		return backup.prv.length;
	};

	function formatExportFile(body) {
		let bodyHash = utils.hexify(openpgp.crypto.hash.sha512(JSON.stringify(body)));

		return JSON.stringify({
			readme: consts.KEYS_BACKUP_README,
			warning: translations.BACKUP_WARNING_TEXT,
			body: body,
			exported: $filter('date')(Date.now(), 'yyyy-MM-dd HH:mm:ss Z'),
			bodyHash: bodyHash
		}, null, 4);
	}

	this.exportKeys = (email = null) => {
		const [keyring] = crypto.createKeyring(false);

		let keyPairs = (email ? [email] : crypto.getAvailableSourceEmails()).reduce((a, email) => {
			a[email] = {
				prv: keyring.privateKeys.getForAddress(email).map(k => k.armor()),
				pub: keyring.publicKeys.getForAddress(email).map(k => k.armor())
			};
			return a;
		}, {});

		return formatExportFile({
			key_pairs: keyPairs
		});
	};

	this.exportKeyPairByFingerprint = (fingerprint) => {
		const [keyring] = crypto.createKeyring(false);

		const privateKey = keyring.privateKeys.findByFingerprint(fingerprint);
		const publicKey = keyring.publicKeys.findByFingerprint(fingerprint);

		return formatExportFile({
			key_pairs: {
				[privateKey.users[0].userId.userid]: {
					prv: [privateKey.armor()],
					pub: [publicKey.armor()]
				}
			}
		});
	};

	this.exportPublicKeyByFingerprint = (fingerprint) => {
		const [keyring] = crypto.createKeyring(false);

		let publicKey = keyring.publicKeys.findByFingerprint(fingerprint);

		return publicKey.armor();
	};

	this.getExportFilename = (backup, userName) => {
		let hashPostfix = utils.hexify(openpgp.crypto.hash.md5(backup)).substr(0, 8);
		return `${userName}-${hashPostfix}.json`;
	};
};