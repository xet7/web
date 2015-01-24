angular.module(primaryApplicationName).service('contacts', function($q, $rootScope, user) {
	var self = this;

	var Contact = function(opt) {
		this.name = opt.name;
		this.email = opt.name;
		this.sec = opt.isSecured ? opt.isSecured : false;
	};

	this.people = [
		new Contact({ name: 'Adam',      email: 'adam@email.com',      sec: 1}),
		new Contact({ name: 'Amalie',    email: 'amalie@email.com',    sec: 0}),
		new Contact({ name: 'Estefania', email: 'estefania@email.com', sec: 0}),
		new Contact({ name: 'Adrian',    email: 'adrian@email.com',    sec: 1}),
		new Contact({ name: 'Wladimir',  email: 'wladimir@email.com',  sec: 1}),
		new Contact({ name: 'Samantha',  email: 'samantha@email.com',  sec: 0}),
		new Contact({ name: 'Nicole',    email: 'nicole@email.com',    sec: 1}),
		new Contact({ name: 'Natasha',   email: 'natasha@email.com',   sec: 1}),
		new Contact({ name: 'Michael',   email: 'michael@email.com',   sec: 0}),
		new Contact({ name: 'Nicolas',   email: 'nicolas@email.com',    sec: 0})
	];

	this.myself = null;

	var addContact = (contact) => {
		self.people.push(contact);
		$rootScope.$broadcast('contacts-changed', self.people);
	};

	$rootScope.$on('user-authenticated', () => {
		self.myself = new Contact({
			name: user.name,
			email: user.email,
			isSecured: true
		});
		addContact(self.myself);
	});
});