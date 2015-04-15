module.exports = /*@ngInject*/($injector, $translate, $timeout, crypto, utils, consts) => {
	const translations = {
		TP_KEY_IS_ENCRYPTED: '',
		TP_KEY_IS_DECRYPTED: ''
	};
	$translate.bindAsObject(translations, 'MAIN.SETTINGS.SECURITY');

	const statuses = {};

	function Key(key) {
		const self = this;

		this.keyId = utils.hexify(key.primaryKey.keyid.bytes);
		this.fingerprint = key.primaryKey.fingerprint;
		this.created = key.primaryKey.created;
		this.algos = key.primaryKey.algorithm.split('_')[0].toUpperCase();
		this.user = key.users[0].userId.userid;
		this.user = this.user.split(' ')[1].replace('<','').replace('>','');

		if (!statuses[self.fingerprint])
			statuses[self.fingerprint] = {
				isCollapsed: true
			};

		let isCollapsed = statuses[self.fingerprint].isCollapsed;
		let decodeTimeout = null;
		let decryptTime = 0;

		this.decryptTime = () => decryptTime;
		this.isDecrypted = () => key && key.primaryKey.isDecrypted;
		this.isCollapsed = () => isCollapsed;
		this.switchCollapse = () => {
			isCollapsed = !isCollapsed;
			statuses[self.fingerprint].isCollapsed = isCollapsed;
		};

		this.getEncryptionStatusTooltip = () => this.isDecrypted()
			? translations.TP_KEY_IS_DECRYPTED
			: translations.TP_KEY_IS_ENCRYPTED;

		this.decrypt = (password) => {
			decodeTimeout = $timeout.schedule(decodeTimeout, () => {
				let r = false;
				if (key && !key.primaryKey.isDecrypted) {
					r = crypto.authenticate(key, password);
					return !!r;
				}

				decryptTime = new Date();
			}, consts.AUTO_SAVE_TIMEOUT);
		};
	}

	return Key;
};