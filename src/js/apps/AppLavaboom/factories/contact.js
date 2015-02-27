module.exports = /*@ngInject*/(co, user, crypto, ContactEmail) => {
	var Contact = function(opt) {
		var self = this;

		angular.extend(this, opt);

		this.hiddenEmail = this.hiddenEmail ? new ContactEmail(this, this.hiddenEmail, 'hidden') : null;
		this.privateEmails = this.privateEmails ? this.privateEmails.map(e => new ContactEmail(this, e, 'private')) : [];
		this.businessEmails = this.businessEmails ? this.businessEmails.map(e => new ContactEmail(this, e, 'business')) : [];

		this.isCustomName = () => self.firstName && self.lastName && self.name != `${self.firstName.trim()} ${self.lastName.trim()}`;

		this.getFullName = (otherName = '') => self.isCustomName() ? self.name + ` (${self.firstName.trim()} ${self.lastName.trim()})` :
			(self.isPrivate() ? (otherName ? otherName + ' ' : '') + self.hiddenEmail.email : self.name);

		this.isMatchEmail = (email) =>
			(self.hiddenEmail && self.hiddenEmail.email == email) ||
			(self.privateEmails && self.privateEmails.some(e => e.email == email)) ||
			(self.businessEmails && self.businessEmails.some(e => e.email == email));

		this.getSortingField = (id) => {
			if (id === 1)
				return self.firstName;
			if (id === 2)
				return self.lastName;
			return self.name;
		};

		this.isPrivate = () => !!self.hiddenEmail || self.name == '$hidden';

		this.isSecured = () => {
			if (self.hiddenEmail && !self.hiddenEmail.isSecured())
				return false;

			if (self.privateEmails)
				if (self.privateEmails.some(e => !e.isSecured()))
					return false;

			if (self.businessEmails)
				if (self.businessEmails.some(e => !e.isSecured()))
					return false;

			return true;
		};

		this.getEmail = (email) => {
			if (self.hiddenEmail && self.hiddenEmail.email == email)
				return self.hiddenEmail;

			if (self.privateEmails) {
				let e = self.privateEmails.find(e => e.email == email);
				if (e)
					return e;
			}
			if (self.businessEmails) {
				let e = self.businessEmails.find(e => e.email == email);
				if (e)
					return e;
			}

			return null;
		};

		this.getSecureClass = () => `sec-${self.isSecured() ? 1 : 0}`;
	};

	var secureFields = ['firstName', 'lastName', 'companyName', 'privateEmails', 'businessEmails', 'hiddenEmail'];

	Contact.toEnvelope = (contact) => co(function *() {
		let data = secureFields.reduce((a, field) => {
			a[field] = contact[field];
			return a;
		}, {});

		console.log('contact to envelope', data);

		var envelope = yield crypto.encodeEnvelopeWithKeys({
			data: data,
			encoding: 'json'
		}, [user.key.key], 'data');
		envelope.name = contact.name;

		return envelope;
	});

	Contact.fromEnvelope = (envelope) => co(function *() {
		var data = yield crypto.decodeEnvelope(envelope, 'data');

		console.log('Contact.fromEnvelope data', data);

		switch (data.majorVersion) {
			default:
				let c = new Contact(angular.extend({}, {
					id: envelope.id,
					name: envelope.name,
					dateCreated: envelope.date_created,
					dateModified: envelope.date_modified,
					isDecrypted: !!data.data
				}, data.data));

				console.log('contact', c);

				return c;
		}
	});

	return Contact;
};