angular.module(primaryApplicationName).service('contacts', function($q, $rootScope, co, user, crypto, apiProxy, Contact) {
	var self = this;

	this.list = () => co(function *() {
		var contacts = (yield apiProxy(['contacts', 'list'])).body.contacts;
		return contacts ? co.map(contacts, Contact.fromEnvelope) : [];
	});

	this.createContact = (contact) => co(function *() {
		var envelope = yield Contact.toEnvelope(contact);
		return yield apiProxy(['contacts', 'create'], envelope);
	});

	this.updateContact = (contact) => co(function *() {
		var envelope = yield Contact.toEnvelope(contact);
		return yield apiProxy(['contacts', 'update'], contact.id, envelope);
	});

	this.deleteContact = (contact) => co(function *() {
		return yield apiProxy(['contacts', 'delete'], contact.id);
	});

	this.initialize = () => co(function*(){
		var contacts = yield self.list();
		console.log('contacts: ', contacts);
		yield contacts.map(c => self.deleteContact(c));

		var testContacts = [
			new Contact({name: 'Ned Stark', email: 'ned@lavaboom.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Winter is coming.', isSecured: true}),
			new Contact({name: 'Theon Greyjoy', email: 'tgreyjoy@lavaboom.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Reluctant to pay iron price.', isSecured: true}),
			new Contact({name: 'Samwell Tarly', email: 'starly@castleblack.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Loyal brother of the watch.'}),
			new Contact({name: 'Jon Snow', email: 'jsnow@castleblack.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Knows nothing.'}),
			new Contact({name: 'Arya Stark', email: 'waterdancer@winterfell.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Has a list of names.'}),
			new Contact({name: 'Jora Mormont', email: 'khaleesifan100@gmail.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Lost in the friend-zone.'}),
			new Contact({name: 'Tyrion Lannister', email: 'tyrion@lannister.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Currently drunk.'}),
			new Contact({name: 'Stannis Baratheon', email: 'onetrueking@lavaboom.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Nobody expects the Stannish inquisition.', isSecured: true}),
			new Contact({name: 'Hodor', email: 'hodor@hodor.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Hodor? Hodor... Hodor!'}),
			new Contact({name: 'Margaery Tyrell', email: 'mtyrell@lavaboom.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Keeper of kings.', isSecured: true}),
			new Contact({name: 'Brienne of Tarth', email: 'oathkeeper@gmail.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Do not cross her.'}),
			new Contact({name: 'Petyr Baelish', email: 'petyr@lavaboom.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Do not trust anyone.', isSecured: true})
		];
		yield testContacts.map(c => self.createContact(c));

		self.people = self.people.concat(yield self.list());
	});

	this.people = [];

	this.getContactById = (id) => {
		for(let c of self.people) {
			if (c.id == id)
				return c;
		}
		return {};
	};

	this.getContactByEmail = (email) => {
		for(let c of self.people)
			if (c.email == email)
				return c;
		return {};
	};

	this.myself = null;

	$rootScope.$on('user-authenticated', () => {
		self.myself = new Contact({
			name: user.name,
			email: user.email,
			isSecured: true
		});
		self.people.push(self.myself);
		$rootScope.$broadcast('contacts-changed', self.people);
	});
});