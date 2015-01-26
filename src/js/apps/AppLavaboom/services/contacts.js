angular.module(primaryApplicationName).service('contacts', function($q, $rootScope, user) {
	var self = this;

	var Contact = function(opt) {
		this.name = opt.name;
		this.email = opt.email;
		this.sec = opt.isSecured ? 1 : 0;
	};

	this.people = [
	    new Contact({id: 0, name: 'Ned Stark', email: 'ned@winterfell.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Winter is coming.', isSecured: 'asd'}),
	    new Contact({id: 1, name: 'Theon Greyjoy', email: 'tgreyjoy@winterfell.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Reluctant to pay iron price.', isSecured: 'asd'}),
	    new Contact({id: 2, name: 'Samwell Tarly', email: 'starly@castleblack.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Loyal brother of the watch.', sec: 1}),
	    new Contact({id: 3, name: 'Jon Snow', email: 'jsnow@castleblack.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Knows nothing.'}),
	    new Contact({id: 4, name: 'Arya Stark', email: 'waterdancer@winterfell.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Has a list of names.'}),
	    new Contact({id: 5, name: 'Jora Mormont', email: 'khaleesifan100@gmail.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Lost in the friend-zone.'}),
	    new Contact({id: 6, name: 'Tyrion Lannister', email: 'tyrion@lannister.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Currently drunk.'}),
	    new Contact({id: 7, name: 'Stannis Baratheon', email: 'onetrueking@dragonstone.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Nobody expects the Stannish inquisition.', isSecured: 'asd'}),
	    new Contact({id: 8, name: 'Hodor', email: 'hodor@hodor.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Hodor? Hodor... Hodor!'}),
	    new Contact({id: 9, name: 'Margaery Tyrell', email: 'mtyrell@highgarden.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Keeper of kings.', isSecured: 'asd'}),
	    new Contact({id: 10, name: 'Brienne of Tarth', email: 'oathkeeper@gmail.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Do not cross her.'}),
	    new Contact({id: 11, name: 'Petyr Baelish', email: 'petyr@baelishindustries.com', phone: '123-456-7890', url: 'www.google.com', notes: 'Do not trust anyone.', sec: 1, isSecured: 'asd'})
  	];

  	
  	this.sortedPeople = _.groupBy(this.people, function(contact) {return contact.name[0]; });


	// contact list, usually would be a separate database
 

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
		addContact(self.myself);
	});
});