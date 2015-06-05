module.exports = ($scope, $modalInstance, Contact, ContactEmail, consts, co, contacts) => {
	$scope.state = 'select';

	$scope.translationData = {
		processed: 0,
		errors: 0,
		total: 0,
		duplicates: 0
	};

	$scope.no = () => {
		$modalInstance.dismiss('no');
	};

	let importContacts = (contactsList) => co(function *(){
		$scope.state = 'importing';
		$scope.translationData.total = contactsList.length;

		while (contactsList.length > 0) {
			let batch = contactsList.splice(0, consts.MAX_API_CONCURENCY_FOR_BULK);

			yield batch.map(c => co(function *(){
				try {
					yield contacts.createContact(c);
					$scope.translationData.processed++;
				} catch (err) {
					console.error('Error during contacts import', c, err);
					$scope.translationData.errors++;
				}
			}));
		}

		$scope.state = 'finished';
	});

	$scope.ok = () => {
		$modalInstance.close('yes');
	};

	$scope.importVcard = (data) => {
		let contactsList = [];

		window.VCF.parse(data, function(vcard) {
			console.log(vcard);

			let firstNameArr = vcard.n['given-name'];
			let firstName = firstNameArr && firstNameArr.length > 0 ? firstNameArr.join(' ').trim() : '';
			let lastNameArr = vcard.n['family-name'];
			let lastName = lastNameArr && lastNameArr.length > 0 ? lastNameArr.join(' ').trim() : '';
			let name = vcard.fn ? vcard.fn.trim() : `${firstName} ${lastName}`.trim();

			if (!firstName || !lastName || !name)
				return;

			let contact = new Contact({
				isDecrypted: true,
				firstName,
				lastName,
				name
			});

			let isFound = false;
			for(let email of vcard.email) {
				if (email && email.value && email.value.includes('@')) {
					if (contacts.getContactByEmail(email.value))
					{
						$scope.translationData.duplicates++;
						isFound = true;
						break;
					}

					let e = new ContactEmail(contact, {
						name: email.value,
						email: email.value
					}, 'private');
					contact.privateEmails.push(e);
				}
			}

			if (isFound)
				return;

			contactsList.push(contact);
		});

		importContacts(contactsList);
	};


	$scope.importCSV = (data) => {
		let contactsData = window.Papa.parse(data);

		let nameIndex = -1;
		let firstNameIndex = -1;
		let lastNameIndex = -1;
		let emailIndexes = [];

		contactsData.data[0].forEach((e, i) => {
			e = e.toLowerCase();
			if (e == 'name')
				nameIndex = i;
			else
			if (e == 'given name' || e == 'first name')
				firstNameIndex = i;
			else
			if (e == 'family name' || e == 'last name')
				lastNameIndex = i;
			else
			if (e.startsWith('e-mail'))
				emailIndexes.push(i);
		});

		let contactsList = [];
		for(let i = 1; i < contactsData.data.length; i++) {
			let cols = contactsData.data[i];

			let definedName = nameIndex > -1 ? cols[nameIndex] : '';

			let firstName = (cols[firstNameIndex] ? cols[firstNameIndex] : '').trim();
			let lastName = (cols[lastNameIndex] ? cols[lastNameIndex] : '').trim();
			let name = (definedName ? definedName : `${firstName} ${lastName}`).trim();
			if (!firstName || !lastName || !name)
				continue;

			let contact = new Contact({
				isDecrypted: true,
				firstName: firstName,
				lastName: lastName,
				name: name
			});

			let isFound = false;
			for(let emailIndex of emailIndexes) {
				let email = cols[emailIndex];
				if (email && email.includes('@')) {
					if (contacts.getContactByEmail(email))
					{
						$scope.translationData.duplicates++;
						isFound = true;
						break;
					}

					let e = new ContactEmail(contact, {
						name: email,
						email
					}, 'private');
					contact.privateEmails.push(e);
				}
			}

			if (isFound)
				continue;

			contactsList.push(contact);
		}

		importContacts(contactsList);
	};
};