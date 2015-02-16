var Buffer = require('buffer/').Buffer;

module.exports = /*@ngInject*/function ($q, $rootScope, $filter, co, crypto, consts) {
	this.importKeys = (jsonBackup) => {
		var importObj = null;
		try {
			importObj = JSON.parse(jsonBackup);
		} catch (error) {
			throw new Error('Invalid keys backup format, json expected!');
		}

		var bodyHash = (new Buffer(openpgp.crypto.hash.sha512(JSON.stringify(importObj.body)), 'binary')).toString('hex');
		if (bodyHash != importObj.bodyHash)
			throw new Error('Backup keys are corrupted!');

		Object.keys(importObj.body.key_pairs).forEach(email => {
			importObj.body.key_pairs[email].prv.forEach(privateKey => {
				try {
					crypto.importPrivateKey(privateKey);
				} catch (error) {
				}
			});
			importObj.body.key_pairs[email].pub.forEach(publicKey => {
				try {
					crypto.importPublicKey(publicKey);
				} catch (error) {
				}
			});
		});

		crypto.storeKeyring();

		$rootScope.$broadcast('keyring-updated');
	};

	this.exportKeys = () => {
		var srcEmails = crypto.getAvailableSourceEmails();

		var keyPairs = srcEmails.reduce((a, email) => {
			a[email] = {
				prv: crypto.getAvailableEncryptedPrivateKeysForEmail(email).map(k => k.armor()),
				pub: crypto.getAvailablePublicKeysForEmail(email).map(k => k.armor())
			};
			return a;
		}, {});

		var body = {
			key_pairs: keyPairs,
			exported: $filter('date')(Date.now(), 'yyyy-MM-dd HH:mm:ss Z')
		};

		var bodyHash = (new Buffer(openpgp.crypto.hash.sha512(JSON.stringify(body)), 'binary')).toString('hex');

		return JSON.stringify({
			readme: consts.KEYS_BACKUP_README,
			body: body,
			bodyHash: bodyHash
		}, null, 4);
	};

	this.getExportFilename = (backup, userName) => {
		var hashPostfix = (new Buffer(openpgp.crypto.hash.md5(backup), 'binary')).toString('hex').substr(0, 8);
		return `${userName}-${hashPostfix}.json`;
	};
};