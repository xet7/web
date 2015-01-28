var Buffer = require('buffer/').Buffer;

angular.module(primaryApplicationName).service('cryptoKeys', function ($q, $rootScope, $filter, co, apiProxy, crypto) {
	var self = this;

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

		var status = [];

		Object.keys(importObj.body.key_pairs).forEach(email => {
			status.push(`process keys for email ${email}...`);
			importObj.body.key_pairs[email].prv.forEach(privateKey => {
				try {
					var key = openpgp.key.readArmored(privateKey).keys[0];
					crypto.keyring.privateKeys.importKey(privateKey);

					status.push(`Imported private key for email '${email}...'(${key.primaryKey.fingerprint} from ${key.primaryKey.created})`);
				} catch (error) {
					status.push(`Can't import private key for email '${email}: ${error.message}'`);
				}
			});
			importObj.body.key_pairs[email].pub.forEach(publicKey => {
				try {
					var key = openpgp.key.readArmored(publicKey).keys[0];
					crypto.keyring.publicKeys.importKey(publicKey);

					status.push(`Imported public key for email '${email}...'(${key.primaryKey.fingerprint} from ${key.primaryKey.created})`);
				} catch (error) {
					status.push(`Can't import public key for email '${email}: ${error.message}'`);
				}
			});
		});

		crypto.keyring.store();

		$rootScope.$broadcast('crypto-dst-emails-updated', crypto.getAvailableDestinationEmails());
		$rootScope.$broadcast('crypto-src-emails-updated', crypto.getAvailableSourceEmails());

		return status;
	};

	this.exportKeys = () => {
		var srcEmails = crypto.getAvailableSourceEmails();

		var keyPairs = srcEmails.reduce((a, email) => {
			a[email] = {
				prv: crypto.keyring.privateKeys.getForAddress(email).map(k => k.armor()),
				pub: crypto.keyring.publicKeys.getForAddress(email).map(k => k.armor())
			};
			return a;
		}, {});

		var body = {
			key_pairs: keyPairs,
			exported: $filter('date')(Date.now(), 'yyyy-MM-dd HH:mm:ss Z')
		};

		var bodyHash = (new Buffer(openpgp.crypto.hash.sha512(JSON.stringify(body)), 'binary')).toString('hex');

		return JSON.stringify({
			readme: 'https://lavaboom.com/placeholder/help/backup-file',
			body: body,
			bodyHash: bodyHash
		}, null, 4);
	};

	this.getExportFilename = (backup, userName = 'test') => {
		var hashPostfix = (new Buffer(openpgp.crypto.hash.md5(backup), 'binary')).toString('hex').substr(0, 8);
		return `${userName}-${hashPostfix}.json`;
	};
});