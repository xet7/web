angular.module(primaryApplicationName).factory('Thread', function($rootScope, co, contacts, $translate) {
	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_AND_ONE_OTHER = $translate.instant('LOADER.LB_AND_ONE_OTHER');
		translations.LB_AND_TWO_OTHERS = $translate.instant('LOADER.LB_AND_TWO_OTHERS');
		translations.LB_AND_OTHERS = $translate.instant('LOADER.LB_AND_OTHERS');
	});

	var Thread = function(opt) {
		this.id = opt.id;
		this.subject = opt.name;
		this.created = opt.date_created;
		this.modified = opt.date_modified;
		this.members = opt.members;

		var members = opt.members.map(email => {
			var contact = contacts.getContactByEmail(email);
			return contact ? contact.name : email;
		});

		this.membersString = members.slice(0, 2).join(',');
		if (members.length == 3)
			this.membersString += ' ' + translations.LB_AND_ONE_OTHER;
		else if (members.length == 4)
			this.membersString += ' ' + translations.LB_AND_TWO_OTHERS;
		else if (members.length > 4)
			this.membersString += ' ' + translations.LB_AND_OTHERS;

		this.isRead = opt.is_read;
		this.isEncrypted = true;
		this.attachmentsCount = 0;
	};

	return Thread;
});