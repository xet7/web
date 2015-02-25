module.exports = /*@ngInject*/($rootScope, $translate) => {
	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_PRIVATE = $translate.instant('MAIN.COMPOSE.LB_PRIVATE');
		translations.LB_BUSINESS = $translate.instant('MAIN.COMPOSE.LB_BUSINESS');
		translations.LB_HIDDEN = $translate.instant('MAIN.COMPOSE.LB_HIDDEN');
	});

	function ContactEmail (contact, opts, kind) {
		let self = this;

		if (!opts)
			opts = {};

		switch (kind) {
			case 'private':
				this.label = translations.LB_PRIVATE;
				break;
			case 'business':
				this.label = translations.LB_BUSINESS;
				break;
			case 'hidden':
				this.label = translations.LB_HIDDEN;
				break;
			default:
				throw new Error('Invalid contact email kind "' + kind + '"!');
		}
		this.getFirstName = () => contact.firstName;
		this.getLastName = () => contact.lastName;
		this.getDisplayName = () => contact.getFullName();
		this.email = opts.email ? opts.email : '';
		this.name = opts.name ? opts.name : '';
		this.isStar = opts.isStar ? opts.isStar : false;
		this.isCollapsed = true;
		this.key = null;

		this.isSecured = () => !!self.key;
		this.secureClass = () => `sec-${self.isSecured() ? 1 : 0}`;
	}

	return ContactEmail;
};