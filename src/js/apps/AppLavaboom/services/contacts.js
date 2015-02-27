module.exports = /*@ngInject*/function($q, $rootScope, co, user, crypto, LavaboomAPI, Contact) {
	const self = this;
	var emptyContact = null;

	var deleteLocally = (contactId) => {
		if (self.people.has(contactId)) {
			self.people.delete(contactId);
		}
	};

	this.newContact = () => {
		if (emptyContact)
			return emptyContact;

		var id = 'new';
		emptyContact = new Contact({
			id: id,
			isSecured: true,
			isNew: true,
			name: 'New contact'
		});
		self.people.set(id, emptyContact);

		$rootScope.$broadcast('contacts-changed');

		return emptyContact;
	};

	this.list = () => co(function *() {
		var contacts = (yield LavaboomAPI.contacts.list()).body.contacts;

		var list = contacts ? yield co.map(contacts, Contact.fromEnvelope) : [];
		return list.reduce((map, c) => {
			map.set(c.id, c);
			return map;
		}, new Map());
	});

	this.createContact = (contact) => co(function *() {
		var envelope = yield Contact.toEnvelope(contact);
		var r = yield LavaboomAPI.contacts.create(envelope);

		if (contact.id) {
			if (contact.id == 'new') {
				delete contact.isNew;
				emptyContact = null;
			}
			deleteLocally(contact.id);
		}

		contact.id = r.body.contact.id;

		self.people.set(contact.id, contact);

		$rootScope.$broadcast('contacts-changed');

		return contact.id;
	});

	this.updateContact = (contact) => co(function *() {
		var envelope = yield Contact.toEnvelope(contact);
		var r = yield LavaboomAPI.contacts.update(contact.id, envelope);

		$rootScope.$broadcast('contacts-changed');

		return r.body.contact.id;
	});

	this.deleteContact = (contactId) => co(function *() {
		if (!emptyContact || contactId != emptyContact.id)
			yield LavaboomAPI.contacts.delete(contactId);
		else
			emptyContact = null;

		deleteLocally(contactId);
		$rootScope.$broadcast('contacts-changed');
	});

	this.initialize = () => co(function*(){
		emptyContact = null;

		if (user.isAuthenticated()) {
			self.myself = new Contact({
				name: user.name,
				email: user.email,
				isSecured: true
			});
		} else
			self.myself = null;

		$rootScope.$bind('keyring-updated', () => {
			self.people = new Map();
			co(function *(){
				self.people = yield self.list();
				$rootScope.$broadcast('contacts-changed');
			});
		});
	});

	this.getContactById = (id) => {
		return self.people.get(id);
	};

	this.getContactByEmail = (email) => {
		return [...self.people.values()].find(c => c.isMatchEmail(email));
	};

	$rootScope.$on('user-authenticated', () => {
		self.myself = new Contact({
			name: user.name,
			email: user.email,
			isSecured: true
		});

		$rootScope.$broadcast('contacts-changed');
	});
};