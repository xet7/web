module.exports = /*@ngInject*/($rootScope, $translate, $timeout, $injector, co, consts) => {
	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_NEW = $translate.instant('MAIN.COMPOSE.LB_NEW');
		translations.LB_PRIVATE = $translate.instant('MAIN.COMPOSE.LB_PRIVATE');
		translations.LB_BUSINESS = $translate.instant('MAIN.COMPOSE.LB_BUSINESS');
		translations.LB_HIDDEN = $translate.instant('MAIN.COMPOSE.LB_HIDDEN');
		translations.LB_EMAIL_NOT_FOUND = $translate.instant('MAIN.CONTACTS.LB_EMAIL_NOT_FOUND');
	});

	function ContactEmail (contact, opts, kind) {
		let inbox = $injector.get('inbox');
		let self = this;

		let tooltip = '';
		var label = '';
		let t = null;
		let isLoadingKey = false;
		let isLoadedKey = false;
		let isCollapsed = true;

		let loadKey = () => co(function *(){
			try {
				let key = yield inbox.getKeyForEmail(self.email);

				self.key = {
					id: key.key_id,
					length: key.length,
					algos: key.algorithm,
					key: key.key
				};

				tooltip = '';
				isLoadedKey = true;
			} catch (err) {
				tooltip = translations.LB_EMAIL_NOT_FOUND;
				self.key = null;
				throw err;
			} finally {
				isLoadingKey = false;
			}
		});

		if (!opts)
			opts = {};

		switch (kind) {
			case 'private':
				label = translations.LB_PRIVATE;
				break;
			case 'business':
				label = translations.LB_BUSINESS;
				break;
			case 'hidden':
				label = (opts.isNew ? `${translations.LB_NEW} ` : '') + translations.LB_HIDDEN;
				break;
			default:
				throw new Error('Invalid contact email kind "' + kind + '"!');
		}

		this.email = opts.email ? opts.email : '';
		this.name = opts.name ? opts.name : '';
		this.isStar = opts.isStar ? opts.isStar : false;
		this.key = opts.key;

		this.isSecured = () => !!self.key;
		this.getSecureClass = () => `sec-${self.isSecured() ? 1 : 0}`;

		this.getFirstName = () => contact ? contact.firstName : '';
		this.getLastName = () => contact ? contact.lastName : '';
		this.getDisplayName = () => contact ? contact.getFullName() : '';
		this.isHidden = () => kind == 'hidden';
		this.isNew = () => !!opts.isNew;
		this.getLabel = () => label;
		this.getTooltip = () => tooltip;
		this.isCollapsed = () => isCollapsed;

		this.collapse = () => isCollapsed = true;
		this.expand = () => isCollapsed = false;
		this.switchCollapse = () => isCollapsed = !isCollapsed;

		this.loadKey = (isReload = false) => co(function *(){
			if (!isReload) {
				if (isLoadedKey)
					return self.key;

				if (isLoadingKey) {
					try {
						yield t;
					} catch (e) {
					}

					return self.key;
				}
			}

			let domain = self.email.split('@')[1];
			if (domain)
				domain = domain.trim();

			if (domain == consts.ROOT_DOMAIN) {
				isLoadingKey = true;

				let promise;
				[t, promise] = $timeout.schedulePromise(t, () => loadKey(), 1000);
				yield promise;
				console.log('scheduled promise completed');
			} else {
				if (t)
					$timeout.cancel(t);
				isLoadingKey = false;

				tooltip = '';
				self.key = null;
			}

			return self.key;
		});

		this.cancelKeyLoading = () => {
			console.log('cancelKeyLoading for email', self.email, new Error(''));
			if (t)
				$timeout.cancel(t);
			isLoadingKey = false;
		};

		this.isLoadingKey = () => isLoadingKey;
	}

	return ContactEmail;
};