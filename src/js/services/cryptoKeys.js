angular.module(primaryApplicationName).service('cryptoKeys', function ($q, $rootScope, $filter, $base64, co, apiProxy, crypto, user) {
	var self = this;

	this.syncKeys = () => {
		co(function *(){
			var res = yield apiProxy('keys', 'list', user.name);

			var keysByFingerprint = res.body.keys ? res.body.keys.reduce((a, k) => {
				a[k.id] = k;
				return a;
			}, {}) : {};

			var publicKeys = crypto.getAvailablePublicKeysForSourceEmails();

			Object.keys(publicKeys).forEach(email => {
				var keysForEmail = publicKeys[email];
				keysForEmail.forEach(key => {
					if (!keysByFingerprint[key.primaryKey.fingerprint]) {
						console.log(`Importing key with fingerprint '${key.primaryKey.fingerprint}' to the server...`);

						apiProxy('keys', 'create', key.armor());
					} else
						console.log(`Key with fingerprint '${key.primaryKey.fingerprint}' already imported...`);
				});
			});
		});
	};

	this.importPublicKey = (publicKey) => {
		var key = openpgp.key.readArmored(publicKey).keys[0];
		console.log('Importing public key ', key);
		crypto.keyring.publicKeys.importKey(key);
	};

	this.importKeys = (jsonBackup) => {
		var importObj = null;
		try {
			importObj = JSON.parse(jsonBackup);
		} catch (error) {
			throw new Error('Invalid keys backup format, json expected!');
		}

		var bodyHash = $base64.encode(openpgp.crypto.hash.sha512(JSON.stringify(importObj.body)));
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

		var bodyHash = $base64.encode(openpgp.crypto.hash.sha512(JSON.stringify(body)));

		return JSON.stringify({
			readme: 'https://lavaboom.com/placeholder/help/backup-file',
			body: body,
			bodyHash: bodyHash
		}, null, 4);
	};
});
