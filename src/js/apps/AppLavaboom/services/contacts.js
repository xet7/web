angular.module(primaryApplicationName).service('contacts', function($q, $rootScope, user) {
	var self = this;

	var Contact = function(opt) {
		this.name = opt.name;
		this.email = opt.email;
		this.sec = opt.isSecured ? 1 : 0;
	};

	this.people = [
		new Contact({name: 'Adam',      email: 'adam@email.com'}),
		new Contact({name: 'Amalie',    email: 'amalie@email.com'}),
		new Contact({name: 'Estefania', email: 'estefania@email.com'}),
		new Contact({name: 'Adrian',    email: 'adrian@email.com'}),
		new Contact({name: 'Wladimir',  email: 'wladimir@email.com'}),
		new Contact({name: 'Samantha',  email: 'samantha@email.com'}),
		new Contact({name: 'Nicole',    email: 'nicole@email.com'}),
		new Contact({name: 'Natasha',   email: 'natasha@email.com'}),
		new Contact({name: 'Michael',   email: 'michael@email.com'}),
		new Contact({name: 'Nicolas',   email: 'nicolas@email.com'})
	];

	this.getContactByEmail = (email) => {
		for(let c of self.people)
			if (c.email == email)
				return c;
		return {};
	};

	this.myself = null;

	var addContact = (contact) => {
		self.people.push(contact);
		$rootScope.$broadcast('contacts-changed', self.people);
	};

	$rootScope.$bind('user-authenticated', () => {
		self.myself = new Contact({
			name: user.name,
			email: user.email,
			isSecured: true
		});
		$rootScope.$broadcast('contacts-changed', self.people);
	});
});