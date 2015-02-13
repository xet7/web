angular.module(primaryApplicationName).service('contacts', function($q, $rootScope, co, user, crypto, apiProxy, Contact) {
	var self = this;
	var emptyContact = null;

	var deleteLocally = (contactId) => {
		if (self.peopleById[contactId]) {
			var index = self.peopleList.findIndex(c => c.id == contactId);

			self.peopleList.splice(index, 1);
			delete self.peopleById[contactId];
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
			name: 'New contact',
			privateEmails: [],
			businessEmails: []
		});
		self.peopleById[id] = emptyContact;
		self.peopleList.unshift(emptyContact);

		$rootScope.$broadcast('contacts-changed');

		return emptyContact;
	};

	this.list = () => co(function *() {
		var contacts = (yield apiProxy(['contacts', 'list'])).body.contacts;

		var list = contacts ? yield co.map(contacts, Contact.fromEnvelope) : [];
		var map = list.reduce((a, c) => {
			a[c.id] = c;
			return a;
		}, {});

		return {
			list: list,
			map: map
		};
	});

	this.createContact = (contact) => co(function *() {
		var envelope = yield Contact.toEnvelope(contact);
		var r = yield apiProxy(['contacts', 'create'], envelope);

		contact.id = r.body.contact.id;

		self.peopleList.unshift(contact);
		self.peopleById[contact.id] = contact;

		$rootScope.$broadcast('contacts-changed');

		return r.body.contact.id;
	});

	this.updateContact = (contact) => co(function *() {
		var envelope = yield Contact.toEnvelope(contact);
		var r = yield apiProxy(['contacts', 'update'], contact.id, envelope);
		return r.body.contact.id;
	});

	this.deleteContact = (contactId) => co(function *() {
		console.log('deleting contact', contactId, 'empty contact?', emptyContact);
		if (!emptyContact || contactId != emptyContact.id)
			yield apiProxy(['contacts', 'delete'], contactId);
		else
			emptyContact = null;

		deleteLocally(contactId);
		$rootScope.$broadcast('contacts-changed');
	});

	this.initialize = () => co(function*(){
		var r = yield self.list();
		self.peopleList = r.list;
		self.peopleById = r.map;
	});

	this.peopleList = [];
	this.peopleById = {};

	this.getContactById = (id) => {
		return self.peopleById[id];
	};

	this.getContactByEmail = (email) => {
		for(let c of self.peopleList)
			if (c.isMatchEmail(email))
				return c;
		return null;
	};

	this.myself = null;

	$rootScope.$on('user-authenticated', () => {
		self.myself = new Contact({
			name: user.name,
			email: user.email,
			isSecured: true
		});
		self.peopleList.push(self.myself);
		self.peopleById[0] = self.myself;
		$rootScope.$broadcast('contacts-changed');
	});
});