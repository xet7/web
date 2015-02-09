angular.module(primaryApplicationName).filter('members', ($rootScope, $translate, contacts) => {
	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_AND_ONE_OTHER = $translate.instant('INBOX.LB_AND_ONE_OTHER');
		translations.LB_AND_TWO_OTHERS = $translate.instant('INBOX.LB_AND_TWO_OTHERS');
		translations.LB_AND_OTHERS = $translate.instant('INBOX.LB_AND_OTHERS');
	});

	return (membersList) => {
		var members = membersList
			? membersList.map(email => {
				var contact = contacts.getContactByEmail(email);
				return contact ? contact.name : email;
			})
			: [];

		var membersString = members.slice(0, 2).join(', ');
		if (members.length == 3)
			membersString += ' ' + translations.LB_AND_ONE_OTHER;
		else if (members.length == 4)
			membersString += ' ' + translations.LB_AND_TWO_OTHERS;
		else if (members.length > 4)
			membersString += ' ' + translations.LB_AND_OTHERS;

		return membersString;
	};
});