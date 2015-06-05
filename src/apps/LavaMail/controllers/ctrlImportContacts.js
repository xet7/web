module.exports = ($scope, $modalInstance, Contact, ContactEmail, co, contacts) => {
	$scope.state = 'select';
	$scope.processed = 0;
	$scope.errors = 0;
	$scope.total = 0;

	$scope.no = () => {
		$modalInstance.dismiss('no');
	};

	let importContacts = (contactsList) => co(function *(){
		$scope.state = 'importing';
		$scope.total = contactsList.length;

		while (contactsList.length > 0) {
			let batch = contactsList.splice(0, 5);

			yield batch.map(c => co(function *(){
				try {
					yield contacts.createContact(c);
					$scope.processed++;
				} catch (err) {
					console.error('Error during contacts import', c, err);
					$scope.errors++;
				}
			}));
		}

		$scope.state = 'finished';
	});

	$scope.ok = () => {
		$modalInstance.close('yes');
	};

	$scope.importGmail = (data) => {
		let contactsData = window.Papa.parse(data);

		let nameIndex = contactsData.data.findIndex(e => e == 'Given Name');
		let firstNameIndex = contactsData.data.findIndex(e => e == 'Given Name');
		let lastNameIndex = contactsData.data.findIndex(e => e == 'Family Name');
		let emailIndexes = [];

		contactsData.data[0].forEach((e, i) => {
			e = e.toLowerCase();
			if (e == 'name')
				nameIndex = i;
			else
			if (e == 'given name')
				firstNameIndex = i;
			else
			if (e == 'family name')
				lastNameIndex = i;
			else
			if (e.startsWith('e-mail'))
				emailIndexes.push(i);
		});

		let contacts = [];
		for(let i = 1; i < contactsData.data.length; i++) {
			let cols = contactsData.data[i];

			let definedName = cols[nameIndex];

			let firstName = (cols[firstNameIndex] ? cols[firstNameIndex] : '').trim();
			let lastName = (cols[lastNameIndex] ? cols[lastNameIndex] : '').trim();
			let name = (definedName ? definedName : `${firstName} ${lastName}`).trim();
			if (!firstName || !lastName || !name)
				continue;

			let contact = new Contact({
				isNew: true,
				firstName: firstName,
				lastName: lastName,
				name: name
			});

			for(let emailIndex of emailIndexes) {
				let email = cols[emailIndex];
				if (email && email.includes('@')) {
					let e = new ContactEmail(contact, {
						name: email
					}, 'private');
					contact.privateEmails.push(e);
				}
			}

			contacts.push(contact);
		}

		importContacts(contacts);
	};
};