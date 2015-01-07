angular.module('AppLavaboomLogin').service('openpgp', function($q){
	var keys = {};

	this.initialize = () => {
		openpgp.initWorker('/vendor/openpgp.worker.js');
	};

	this.exportKeys = () => {
	};

	this.importKeys = () => {

	};

	this.saveKeys = () => {

	};

	this.loadKeys = () => {

	};

	this.generateOpenpgpKeys = (email, password, numBits) => {
		if (!numBits)
			numBits = 1024;

		var deferred = $q.defer();

		openpgp.generateKeyPair({numBits: numBits, userId: email, passphrase: password})
			.then(freshKeys => {
				keys[email] = freshKeys;

				deferred.resolve(freshKeys);
			})
			.catch(error =>{
				deferred.reject(error);
			});

		return deferred.promise;
	};

	this.generateKbpgpKeys = (email, password, numBits) => {
		if (!numBits)
			numBits = 1024;

		var F = kbpgp["const"].openpgp;

		var opts = {
			userid: email,
			primary: {
				nbits: numBits,
				flags: F.certify_keys | F.sign_data | F.auth | F.encrypt_comm | F.encrypt_storage,
				expire_in: 0
			},
			subkeys: [
			]
		};

		var deferred = $q.defer();

		kbpgp.KeyManager.generate(opts, (error, alice) => {
			if (error)
				return deferred.reject(error);

			var privateKey = null;
			var publicKey = null;

			alice.sign({}, err => {
				console.log(alice);

				alice.export_pgp_private_to_client({
					passphrase: password
				},  (err, pgp_private) => {
					privateKey = pgp_private;

					if (privateKey && publicKey)
						deferred.resolve({
							privateKeyArmored: privateKey,
							publicKeyArmored: publicKey
						});
				});
				alice.export_pgp_public({}, (err, pgp_public) =>{
					publicKey = pgp_public;

					if (privateKey && publicKey)
						deferred.resolve({
							privateKeyArmored: privateKey,
							publicKeyArmored: publicKey
						});
				});
			});
		});

		return deferred.promise;
	};
});