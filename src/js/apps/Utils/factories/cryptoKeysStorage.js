module.exports = /*@ngInject*/(co, utils) => {
	const prefix = 'lava-openpgp-';
	const publicKeysItem = 'public-keys';
	const privateKeysItem = 'private-keys';

	const publicName = prefix + publicKeysItem;
	const privateName = prefix + privateKeysItem;
	const privateSecureName = prefix + 'secure-' + privateKeysItem;

	/*
	 isPrivateComputer: store decrypted private keys in local storage
	 isShortMemory: store both encrypted and decrypted private keys in session storage only
	 normally we want isShortMemory only when Lavaboom Sync is enabled and all our encrypted private keys were synced

	 loadOnlyForEmails: load private and public keys that match only those email
	 isLoadDecrypted: load decrypted private keys
	 */

	function CryptoKeysStorage (isPrivateComputer = false, isShortMemory = false, loadOnlyForEmails = [], isLoadDecrypted = false) {
		const self = this;

		console.log('CryptoKeysStorage created, isPrivateComputer:', isPrivateComputer,
			'isShortMemory:', isShortMemory,
			'loadOnlyForEmails:', loadOnlyForEmails,
			'isLoadDecrypted:', isLoadDecrypted);

		const loadKeys = (storage, name, notForEmail = '', onlyForEmail = '') => {
			const keys = [];
			const armoredKeys = utils.def(() => JSON.parse(storage[name]), null);

			if (armoredKeys && armoredKeys.length > 0) {
				for (let keyArmored of armoredKeys) {
					const key = openpgp.key.readArmored(keyArmored);
					if (!key.err) {
						const email = utils.getEmailFromAddressString(key.keys[0].users[0].userId.userid);

						if (notForEmail) {
							if (email != notForEmail)
								keys.push(key.keys[0]);
							continue;
						}

						if (onlyForEmail) {
							if (email == onlyForEmail)
								keys.push(key.keys[0]);
							continue;
						}

						if (loadOnlyForEmails.length < 1 || loadOnlyForEmails.includes(email))
							keys.push(key.keys[0]);
					}
				}
			}
			return keys;
		};

		const replaceKeys = (dstKeys, srcKeys) => {
			for (let srcKey of srcKeys) {
				const i = dstKeys.findIndex(k => k.primaryKey.fingerprint == srcKey.primaryKey.fingerprint);
				if (i < 0)
					dstKeys.push(srcKey);
				else
					dstKeys[i] = srcKey;
			}
		};

		const storeKeys = (storage, name, keys) => {
			const armoredKeys = keys.map(k => k.armor());
			storage[name] = JSON.stringify(armoredKeys);
		};

		this.clearAllKeys = () => {
			delete localStorage[privateName];
			delete localStorage[publicName];
			self.clearDecryptedPrivateKeys();
		};

		this.clearDecryptedPrivateKeys = () => {
			delete localStorage[privateSecureName];
			delete sessionStorage[privateSecureName];
		};

		this.clearPermanentPrivateKeysForEmail = (email) => {
			let [rPrivateKeys, rPrivateSecuredKeys] = [
				loadKeys(localStorage, privateName, '', email),
				loadKeys(localStorage, privateSecureName, '', email)
			];

			storeKeys(localStorage, privateName, loadKeys(localStorage, privateName, email));
			storeKeys(localStorage, privateSecureName, loadKeys(localStorage, privateSecureName, email));

			replaceKeys(rPrivateKeys, loadKeys(sessionStorage, privateName, '', email));
			replaceKeys(rPrivateSecuredKeys, loadKeys(sessionStorage, privateSecureName, '', email));

			return [rPrivateKeys, rPrivateSecuredKeys];
		};

		this.loadPublic = () => {
			return loadKeys(localStorage, publicName);
		};

		this.loadPrivate = () => {
			const keys = loadKeys(localStorage, privateName);
			replaceKeys(keys, loadKeys(sessionStorage, privateName));

			if (isLoadDecrypted) {
				replaceKeys(keys, loadKeys(localStorage, privateSecureName));
				replaceKeys(keys, loadKeys(sessionStorage, privateSecureName));
			}

			return keys;
		};

		this.storePublic = (keys) => {
			storeKeys(localStorage, publicName, keys);
		};

		const storePrivateKeys = (storage, name, keys) => {
			const existingKeys = loadKeys(storage, name);
			replaceKeys(existingKeys, keys);
			storeKeys(storage, name, existingKeys);
		};

		this.storePrivate = (keys) => {
			console.log('storePrivate called, isShortMemory:', isShortMemory);
			storePrivateKeys(isShortMemory ? sessionStorage : localStorage,
				privateName, keys.filter(k => !k.primaryKey.isDecrypted));

			storePrivateKeys(isPrivateComputer && !isShortMemory ? localStorage : sessionStorage,
				privateSecureName, keys.filter(k => k.primaryKey.isDecrypted));
		};
	}

	CryptoKeysStorage.prototype.publicKeysItem = publicKeysItem;
	CryptoKeysStorage.prototype.privateKeysItem = privateKeysItem;

	return CryptoKeysStorage;
};