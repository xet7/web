module.exports = /*@ngInject*/($rootScope, $translate) => {
	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_NEW = $translate.instant('MAIN.COMPOSE.LB_NEW');
		translations.LB_PRIVATE = $translate.instant('MAIN.COMPOSE.LB_PRIVATE');
		translations.LB_BUSINESS = $translate.instant('MAIN.COMPOSE.LB_BUSINESS');
		translations.LB_HIDDEN = $translate.instant('MAIN.COMPOSE.LB_HIDDEN');
	});

	function ContactEmail (contact, opts, kind) {
		let self = this;

		if (!opts)
			opts = {};

		var label = '';
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
		this.isCollapsed = true;
		this.key = opts.key;

		this.isSecured = () => !!self.key;
		this.getSecureClass = () => `sec-${self.isSecured() ? 1 : 0}`;

		this.getFirstName = () => contact ? contact.firstName : '';
		this.getLastName = () => contact ? contact.lastName : '';
		this.getDisplayName = () => contact ? contact.getFullName() : '';
		this.isNew = () => !!opts.isNew;
		this.getLabel = () => label;
	}

	return ContactEmail;
};