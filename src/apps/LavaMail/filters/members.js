module.exports = ($rootScope, $translate, contacts) => {
	const translations = {
		LB_AND_ONE_OTHER : '',
		LB_AND_TWO_OTHERS : '',
		LB_AND_OTHERS : ''
	};

	$translate.bindAsObject(translations, 'LAVAMAIL.INBOX');

	return (membersList) => {
		let membersString = membersList.slice(0, 2).join(', ');
		if (membersList.length == 3)
			membersString += ' ' + translations.LB_AND_ONE_OTHER;
		else if (membersList.length == 4)
			membersString += ' ' + translations.LB_AND_TWO_OTHERS;
		else if (membersList.length > 4)
			membersString += ' ' + translations.LB_AND_OTHERS;

		return membersString;
	};
};