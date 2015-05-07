module.exports = /*@ngInject*/($injector, $translate, $timeout, crypto, utils, consts, dateFilter) => {
	const translations = {
		TP_KEY_IS_ENCRYPTED: '',
		TP_KEY_IS_DECRYPTED: '',
		LB_EXPIRED: '',
		LB_EXPIRING_SOON: ''
	};
	$translate.bindAsObject(translations, 'MAIN.SETTINGS.SECURITY');

	const statuses = {};

	function Key(key) {
		const self = this;

		const daysToMsec = 24 * 60 * 60 * 1000;
		const now = () => new Date();

		this.keyId = utils.hexify(key.primaryKey.keyid.bytes);
		this.fingerprint = key.primaryKey.fingerprint;
		this.created = new Date(Date.parse(key.primaryKey.created));
		this.expiredAt = new Date(Date.parse(key.primaryKey.created) + consts.KEY_EXPIRY_DAYS * daysToMsec);
		this.algos = key.primaryKey.algorithm.split('_')[0].toUpperCase();
		this.length = key.primaryKey.getBitSize();
		this.user = key.users[0].userId.userid;
		this.email = utils.getEmailFromAddressString(key.users[0].userId.userid);

		if (!statuses[self.fingerprint])
			statuses[self.fingerprint] = {
				isCollapsed: true
			};

		let isCollapsed = statuses[self.fingerprint].isCollapsed;
		let decodeTimeout = null;
		let decryptTime = 0;

		this.getTitle = () =>
			(self.isExpiringSoon ? `(${translations.LB_EXPIRING_SOON}) ` : '') +
			(self.isExpired ? `(${translations.LB_EXPIRED}) ` : '') +
			dateFilter(self.created);

		this.isExpired = now() > self.expiredAt;
		this.isExpiringSoon = !self.isExpired && (now() > self.expiredAt.getTime() - consts.KEY_EXPIRY_DAYS_WARNING * daysToMsec);

		this.getDecryptTime = () => decryptTime;
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

		this.armor = () => key.armor();
	}

	return Key;
};