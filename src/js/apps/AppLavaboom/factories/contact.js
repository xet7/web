module.exports = /*@ngInject*/(co, user, crypto, ContactEmail) => {
	var Contact = function(opt) {
		var self = this;

		if (opt.isSecured === undefined)
			opt.isSecured = false;
		angular.extend(this, opt);
		this.sec = opt.isSecured ? 1 : 0;

		if (!this.name && this.email)
			this.name = this.email.split('@')[0].trim();

		this.privateEmails = this.privateEmails ? this.privateEmails.map(e => new ContactEmail(this, e, 'private')) : [];
		this.businessEmails = this.businessEmails ? this.businessEmails.map(e => new ContactEmail(this, e, 'business')) : [];

		this.isCustomName = () => self.firstName && self.lastName && self.name != `${self.firstName.trim()} ${self.lastName.trim()}`;

		this.getFullName = () => self.isCustomName() ? self.name + ` (${self.firstName.trim()} ${self.lastName.trim()})` : self.name;

		this.isMatchEmail = (email) =>
		(self.email == email) ||
		(self.privateEmails && self.privateEmails.includes(email)) ||
		(self.businessEmails && self.businessEmails.includes(email));

		this.getSortingField = (id) => {
			if (id === 1)
				return self.firstName;
			if (id === 2)
				return self.lastName;
			return self.name;
		};

		this.isPrivate = () => !!self.email;
	};

	var secureFields = ['email', 'firstName', 'lastName', 'companyName', 'privateEmails', 'businessEmails', 'isSecured'];

	Contact.toEnvelope = (contact) => co(function *() {
		var envelope = yield crypto.encodeEnvelopeWithKeys({
			data: secureFields.reduce((a, field) => {
				a[field] = contact[field];
				return a;
			}, {}),
			encoding: 'json'
		}, [user.key.key], 'data');
		envelope.name = contact.name;

		return envelope;
	});

	Contact.fromEnvelope = (envelope) => co(function *() {
		var data = yield crypto.decodeEnvelope(envelope, 'data');

		switch (data.majorVersion) {
			default:
				let c = new Contact(angular.extend({}, {
					id: envelope.id,
					name: envelope.name,
					isSecured: true,
					dateCreated: envelope.date_created,
					dateModified: envelope.date_modified
				}, data.data));

				console.log('contact', c);

				return c;
		}
	});

	return Contact;
};