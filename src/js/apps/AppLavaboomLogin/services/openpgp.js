angular.module('AppLavaboomLogin').service('openpgp', function($q){
	var keyring = localStorage['keyring'] ? JSON.parse(localStorage['keyring']) : {};

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
				keyring[email] = {
					key_pub: freshKeys.publicKeyArmored,
					key_prv: freshKeys.privateKeyArmored,
					generated: Date.now()
				};
				localStorage['keyring'] = JSON.stringify(keyring);

				deferred.resolve(freshKeys);
			})
			.catch(error =>{
				deferred.reject(error);
			});

		return deferred.promise;
	};
});