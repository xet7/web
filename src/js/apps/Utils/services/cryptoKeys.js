module.exports = /*@ngInject*/function ($q, $rootScope, $filter, co, crypto, consts, utils) {
	this.importKeys = (jsonBackup) => {
		let importObj = null;
		try {
			importObj = JSON.parse(jsonBackup);
		} catch (error) {
			let keyring = openpgp.key.readArmored(jsonBackup);

			if (keyring.err && keyring.err.length > 0)
				throw new Error('WRONG_FORMAT');

			for(let key of keyring.keys) {
				if (!crypto.getPrivateKeyByFingerprint(key.primaryKey.fingerprint))
					crypto.importPrivateKey(key);
				else
					console.log('skip private key import - already existing', key.primaryKey.fingerprint);
			}

			return;
		}

		let bodyHash = utils.hexify(openpgp.crypto.hash.sha512(JSON.stringify(importObj.body)));
		if (bodyHash != importObj.bodyHash)
			throw new Error('CORRUPTED');

		Object.keys(importObj.body.key_pairs).forEach(email => {
			importObj.body.key_pairs[email].prv.forEach(privateKeyArmored => {
				try {
					for(let key of openpgp.key.readArmored(privateKeyArmored).keys) {
						if (!crypto.getPrivateKeyByFingerprint(key.primaryKey.fingerprint))
							crypto.importPrivateKey(key);
						else
							console.log('skip private key import - already existing', key.primaryKey.fingerprint);
					}
				} catch (error) {
					console.warn('cannot import private key', privateKeyArmored, error);
				}
			});
			importObj.body.key_pairs[email].pub.forEach(publicKeyArmored => {
				try {
					for(let key of openpgp.key.readArmored(publicKeyArmored).keys) {
						if (!crypto.getPublicKeyByFingerprint(key.primaryKey.fingerprint))
							crypto.importPublicKey(key);
						else
							console.log('skip public key import - already existing', key.primaryKey.fingerprint);
					}
				} catch (error) {
					console.warn('cannot import public key', publicKeyArmored, error);
				}
			});
		});

		crypto.initialize();
	};

	this.exportKeys = (email = null) => {
		const keyring = crypto.createKeyring(false);

		let keyPairs = (email ? [email] : crypto.getAvailableSourceEmails()).reduce((a, email) => {
			a[email] = {
				prv: keyring.privateKeys.getForAddress(email).map(k => k.armor()),
				pub: keyring.publicKeys.getForAddress(email).map(k => k.armor())
			};
			return a;
		}, {});

		let body = {
			key_pairs: keyPairs,
			exported: $filter('date')(Date.now(), 'yyyy-MM-dd HH:mm:ss Z')
		};

		let bodyHash = utils.hexify(openpgp.crypto.hash.sha512(JSON.stringify(body)));

		return JSON.stringify({
			readme: consts.KEYS_BACKUP_README,
			body: body,
			bodyHash: bodyHash
		}, null, 4);
	};

	this.exportKeyByFingerprint = (fingerprint) => {
		const keyring = crypto.createKeyring(false);

		const privateKey = keyring.privateKeys.findByFingerprint(fingerprint);
		const publicKey = keyring.publicKeys.findByFingerprint(fingerprint);

		console.log(privateKey, publicKey);

		let body = {
			key_pairs: {
				[privateKey.users[0].userId.userid]: {
					prv: privateKey.armor(),
					pub: publicKey.armor()
				}
			},
			exported: $filter('date')(Date.now(), 'yyyy-MM-dd HH:mm:ss Z')
		};

		let bodyHash = utils.hexify(openpgp.crypto.hash.sha512(JSON.stringify(body)));

		return JSON.stringify({
			readme: consts.KEYS_BACKUP_README,
			body: body,
			bodyHash: bodyHash
		}, null, 4);
	};

	this.getExportFilename = (backup, userName) => {
		let hashPostfix = utils.hexify(openpgp.crypto.hash.md5(backup)).substr(0, 8);
		return `${userName}-${hashPostfix}.json`;
	};
};