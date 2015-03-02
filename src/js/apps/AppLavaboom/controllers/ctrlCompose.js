module.exports = /*@ngInject*/($rootScope, $scope, $stateParams, $translate,
							   consts, co, user, contacts, inbox, router, Manifest, Attachment, Contact, Hotkey, ContactEmail) => {
	$scope.isWarning = false;
	$scope.isError = false;
	$scope.isXCC = false;
	$scope.toolbar = [
		['h1', 'h2', 'h3'],
		['bold', 'italics', 'underline'],
		['justifyLeft', 'justifyCenter', 'justifyRight'],
		['ul', 'ol'],
		['indent', 'outdent', 'quote'],
		['insertImage']
	];
	let hiddenContacts = {};

	var threadId = $stateParams.replyThreadId;
	var toEmail = $stateParams.to;

	$scope.attachments = [];

	var processAttachment = (attachmentStatus) => co(function *() {
		attachmentStatus.status = 'reading';
		attachmentStatus.isCancelled = false;

		try {
			yield attachmentStatus.attachment.read();
		} catch (err) {
			attachmentStatus.status = 'cannot read';
			throw err;
		} finally {
			if (attachmentStatus.isCancelled)
				throw new Error('cancelled');
		}

		console.log('dropzone added file', attachmentStatus);

		try {
			attachmentStatus.ext = attachmentStatus.attachment.type.split('/')[0];
		} catch (err) {
			attachmentStatus.ext = 'file';
		}

		var envelope;
		attachmentStatus.status = 'encrypting';
		try {
			envelope = yield Attachment.toEnvelope(attachmentStatus.attachment);
		} catch (err) {
			attachmentStatus.status = 'cannot encrypt';
			throw err;
		} finally {
			if (attachmentStatus.isCancelled)
				throw new Error('cancelled');
		}

		var r;
		attachmentStatus.status = 'uploading';
		try {
			r = yield inbox.uploadAttachment(envelope);
			attachmentStatus.id = r.body.file.id;
			attachmentStatus.status = 'uploaded!';
		} catch (err) {
			attachmentStatus.status = 'cannot upload';
			throw err;
		} finally {
			if (attachmentStatus.isCancelled)
				throw new Error('cancelled');
		}
	});

	var deleteAttachment = (attachmentStatus, index) => co(function *() {
		attachmentStatus.isCancelled = true;

		try {
			yield attachmentStatus.processingPromise;
		} catch (err) {
			if (err.message != 'cancelled')
				throw err;
		}

		if (attachmentStatus.id)
			try {
				yield inbox.deleteAttachment(attachmentStatus.id);
			} catch (err) {
				attachmentStatus.status = 'cannot delete';
				throw err;
			}

		$scope.attachments.splice(index, 1);
	});

	$scope.onFileDrop = (file, action) => {
		if (_.startsWith(file.type, 'image')) return;
		var attachmentStatus = {
			attachment: new Attachment(file)
		};
		attachmentStatus.processingPromise = processAttachment(attachmentStatus);
		$scope.attachments.push(attachmentStatus);
	};

	$scope.deleteAttachment = (attachmentStatus, index) => deleteAttachment(attachmentStatus, index);

	let manifest = null;

	$scope.send = () => co(function *() {
		if (!$scope.__form.$valid || $scope.form.selected.to.length < 1 || $scope.form.body.length < 1)
			return;

		yield $scope.attachments.map(a => a.processingPromise);

		let to = $scope.form.selected.to.map(e => e.email),
			cc = $scope.form.selected.cc.map(e => e.email),
			bcc = $scope.form.selected.bcc.map(e => e.email);

		let keys = yield ([...$scope.form.selected.to, ...$scope.form.selected.cc, ...$scope.form.selected.bcc].reduce((a, e) => {
			a[e.email] = co.def(e.loadKey(), null);
			return a;
		}, {}));

		manifest = Manifest.create({
			fromEmail: user.email,
			to,
			cc,
			bcc,
			subject: $scope.form.subject
		});
		manifest.setBody($scope.form.body);
		for(let attachmentStatus of $scope.attachments)
			manifest.addAttachment(attachmentStatus.id, attachmentStatus.attachment.body, attachmentStatus.attachment.name, attachmentStatus.attachment.type);

		try {
			$scope.isError = false;
			var sendStatus = yield inbox.send({
				body: $scope.form.body,
				attachmentIds: $scope.attachments.map(a => a.id),
				threadId
			}, manifest, keys);

			console.log('compose send status', sendStatus);

			if (sendStatus.isEncrypted) {
				yield $scope.confirm();
			} else {
				$scope.isWarning = true;
			}
		} catch (err) {
			$scope.isError = true;
			throw err;
		}
	});

	$scope.confirm = () => co(function *(){
		try {
			$scope.isWarning = false;

			yield inbox.confirmSend();

			yield manifest.getDestinationEmails()
				.filter(email => !contacts.getContactByEmail(email))
				.map(email => {
					let contact = new Contact({name: '$hidden'});
					contact.hiddenEmail = hiddenContacts[email];
					return contacts.createContact(contact);
				});

			manifest = null;

			router.hidePopup();
		} catch (err) {
			$scope.isError = true;
			throw err;
		}
	});

	$scope.reject = () => {
		$scope.isWarning = false;

		inbox.rejectSend();
		manifest = null;
	};

	$scope.clearError = () => co(function *(){
		$scope.isError = false;
	});

	let emailTransform = function (email) {
		if (!email)
			return null;

		let c = contacts.getContactByEmail(email);
		if (c) {
			let e = c.getEmail(email);
			if (e)
				return e;
		}

		return new ContactEmail(null, {
			name: 'hidden',
			email,
			isNew: true
		}, 'hidden');
	};

	$scope.$bind('contacts-changed', () => {
		let toEmailContact = toEmail ? new Contact({email: toEmail}) : null;

		let people = [...contacts.people.values()];
		let map = people.reduce((a, c) => {
			if (c.hiddenEmail)
				a.set(c.hiddenEmail.email, c.hiddenEmail);

			return a;
		}, new Map());

		map = people.reduce((a, c) => {
			c.privateEmails.forEach(e => a.set(e.email, e));
			c.businessEmails.forEach(e => a.set(e.email, e));

			return a;
		}, map);

		if (toEmailContact)
			map.set(toEmailContact.email, toEmailContact);

		$scope.people = [...map.values()];
		console.log('$scope.people', $scope.people);

		let bindUserSignature = () => {
			if (user.settings.isSignatureEnabled && user.settings.signatureHtml)
				$scope.form.body = $scope.form.body + user.settings.signatureHtml;
		};

		if (threadId) {
			co(function *() {
				let thread = yield inbox.getThreadById(threadId);

				let to = emailTransform(thread.members[0]);
				console.log('reply to', thread.members[0], to);
				$scope.form = {
					person: {},
					selected: {
						to: to ? [to] : [],
						cc: [],
						bcc: [],
						from: contacts.myself
					},
					fromEmails: [contacts.myself],
					subject: `Re: ${thread.subject}`,
					body: ''
				};

				bindUserSignature();
			});
		} else {
			$scope.form = {
				person: {},
				selected: {
					to: [],
					cc: [],
					bcc: [],
					from: contacts.myself
				},
				fromEmails: [contacts.myself],
				subject: '',
				body: ''
			};

			bindUserSignature();
		}

		console.log('$scope.form', $scope.form);
	});

	$scope.clearTo = () => $scope.form.selected.to = [];
	$scope.clearCC = () => $scope.form.selected.cc = [];
	$scope.clearBCC = () => $scope.form.selected.bcc = [];

	$scope.taggingTokens = 'SPACE|,|/';

	$scope.tagClicked = (select, item, model) => {
		const index = model.findIndex(c => c.email == item.email);
		if (index > -1) {
			model.splice(index, 1);
			select.search = item.getTag();
		}
	};

	let newHiddenContact = null;
	$scope.tagTransform = function (newTag) {
		if (!newTag)
			return null;

		let p = newTag.split('@');

		let [name, email] = p.length > 1
			? [p[0].trim(), `${p[0].trim()}@${p[1].trim()}`]
			: [newTag.trim(), `${newTag.trim()}@${consts.ROOT_DOMAIN}`];

		if (newHiddenContact) {
			if (newHiddenContact.email == email)
				return newHiddenContact;

			newHiddenContact.cancelKeyLoading();
		}

		if (hiddenContacts[email])
			return hiddenContacts[email];

		if (contacts.getContactByEmail(email))
			return null;

		newHiddenContact = new ContactEmail(null, {
			isTag: true,
			tag: newTag,
			name,
			email,
			isNew: true
		}, 'hidden');

		co(function* (){
			try {
				yield newHiddenContact.loadKey();
			} catch (err) {
				newHiddenContact.isError = true;
				if (err.original.status == 404) {
					newHiddenContact.isNotFoundError = true;
				}
			}
		});

		hiddenContacts[newHiddenContact.email] = newHiddenContact;
		return newHiddenContact;
	};

	$scope.personFilter = (text) =>
		(person) => {
			text = text.toLowerCase();


			return person &&
				(!$scope.form || !$scope.form.selected.to.some(e => e.email == person.email)) && (
					person.getDisplayName().toLowerCase().includes(text) ||
					person.name.toLowerCase().includes(text) ||
					person.email.toLowerCase().includes(text)
				);
		};

    // Add hotkeys
	Hotkey.addHotkey({
        combo: ['ctrl+enter', 'command+enter'],
        description: 'HOTKEY.SEND_EMAIL',
        callback: (event, key) => {
            event.preventDefault();
            $scope.send();
        },
        allowIn: ['INPUT', 'SELECT', 'TEXTAREA', 'P', 'DIV']
    });
};