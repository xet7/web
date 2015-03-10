module.exports = /*@ngInject*/($rootScope, $scope, $stateParams, $translate,
							   consts, co, user, contacts, inbox, router, Manifest, Contact, Hotkey, ContactEmail, Email, Attachment) => {
	$scope.toolbar = [
		['h1', 'h2', 'h3'],
		['bold', 'italics', 'underline'],
		['justifyLeft', 'justifyCenter', 'justifyRight'],
		['ul', 'ol'],
		['indent', 'outdent', 'quote'],
		['insertImage']
	];
	$scope.taggingTokens = 'SPACE|,|/';

	$scope.isWarning = false;
	$scope.isError = false;
	$scope.isXCC = false;
	$scope.isShowWarning = false;
	$scope.attachments = [];

	const hiddenContacts = {};
	const threadId = $stateParams.replyThreadId;
	const toEmail = $stateParams.to;
	let manifest = null;
	let newHiddenContact = null;

	const translations = {};
	$translate.bind(translations, [
		'LB_ATTACHMENT_STATUS_READING',
		'LB_ATTACHMENT_STATUS_READING_ERROR',
		'LB_ATTACHMENT_STATUS_DELETING_ERROR',
		'LB_ATTACHMENT_STATUS_ENCRYPTING',
		'LB_ATTACHMENT_STATUS_ENCRYPTING_ERROR',
		'LB_ATTACHMENT_STATUS_FORMATTING',
		'LB_ATTACHMENT_STATUS_FORMATTING_ERROR',
		'LB_ATTACHMENT_STATUS_UPLOADING',
		'LB_ATTACHMENT_STATUS_UPLOADING_ERROR',
		'LB_ATTACHMENT_STATUS_UPLOADED'
	], 'MAIN.COMPOSE');

	const processAttachment = (attachmentStatus) => co(function *() {
		attachmentStatus.status = translations.LB_ATTACHMENT_STATUS_READING;
		attachmentStatus.isCancelled = false;

		try {
			yield attachmentStatus.attachment.read();
		} catch (err) {
			attachmentStatus.status = translations.LB_ATTACHMENT_STATUS_READING_ERROR;
			throw err;
		} finally {
			if (attachmentStatus.isCancelled)
				throw new Error('cancelled');
		}

		attachmentStatus.status = '';

		try {
			attachmentStatus.ext = attachmentStatus.attachment.type.split('/')[0];
		} catch (err) {
			attachmentStatus.ext = 'file';
		}
	});

	$scope.onFileDrop = (file) => {
		if (file.type && file.type.startsWith('image'))
			return;

		const attachmentStatus = {
			attachment: new Attachment(file)
		};
		attachmentStatus.processingPromise = processAttachment(attachmentStatus);
		$scope.attachments.push(attachmentStatus);
	};

	$scope.deleteAttachment = (attachmentStatus, index) => co(function *() {
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
				attachmentStatus.status = translations.LB_ATTACHMENT_STATUS_DELETING_ERROR;
				throw err;
			}

		$scope.attachments.splice(index, 1);
	});

	$scope.uploadAttachment = (attachmentStatus, keys) => co(function *() {
		const isSecured = Email.isSecuredKeys(keys);

		let envelope;
		attachmentStatus.status = isSecured ? translations.LB_ATTACHMENT_STATUS_ENCRYPTING : translations.LB_ATTACHMENT_STATUS_FORMATTING;
		try {
			envelope = yield Attachment.toEnvelope(attachmentStatus.attachment, keys);
		} catch (err) {
			attachmentStatus.status = isSecured ? translations.LB_ATTACHMENT_STATUS_ENCRYPTING_ERROR : translations.LB_ATTACHMENT_STATUS_FORMATTING_ERROR;
			throw err;
		} finally {
			if (attachmentStatus.isCancelled)
				throw new Error('cancelled');
		}

		let r;
		attachmentStatus.status = translations.LB_ATTACHMENT_STATUS_UPLOADING;
		try {
			r = yield inbox.uploadAttachment(envelope);
			attachmentStatus.id = r.body.file.id;
			attachmentStatus.status = translations.LB_ATTACHMENT_STATUS_UPLOADED;
		} catch (err) {
			attachmentStatus.status = translations.LB_ATTACHMENT_STATUS_UPLOADING_ERROR;
			throw err;
		} finally {
			if (attachmentStatus.isCancelled)
				throw new Error('cancelled');
		}
	});

	$scope.$watch('isShowWarning', (o, n) => {
		if (o == n)
			return;

		user.update({isShowComposeScreenWarning: $scope.isShowWarning});
	});

	$scope.toggleIsShowWarning = (event) => {
		$scope.isShowWarning = !$scope.isShowWarning;
	};

	$scope.isValid = () => $scope.__form.$valid && $scope.form.selected.to.length > 0 && $scope.form.subject.length > 0 && $scope.form.body.length > 0;

	$scope.send = () => co(function *() {
		if (!$scope.isValid())
			return;

		$scope.isError = false;
		$scope.isWarning = false;

		yield $scope.attachments.map(a => a.processingPromise);

		let to = $scope.form.selected.to.map(e => e.email),
			cc = $scope.form.selected.cc.map(e => e.email),
			bcc = $scope.form.selected.bcc.map(e => e.email);

		let keys = yield ([...$scope.form.selected.to, ...$scope.form.selected.cc, ...$scope.form.selected.bcc].reduce((a, e) => {
			a[e.email] = co.transform(co.def(e.loadKey(), null), v => v.key);
			return a;
		}, {}));

		const isSecured = Email.isSecuredKeys(keys);

		yield $scope.attachments.map(attachmentStatus => $scope.uploadAttachment(attachmentStatus, keys));

		manifest = Manifest.create({
			fromEmail: user.email,
			to,
			cc,
			bcc,
			subject: $scope.form.subject
		});
		manifest.setBody($scope.form.body, 'text/html');
		for(let attachmentStatus of $scope.attachments)
			manifest.addAttachment(attachmentStatus.attachment.id,
				attachmentStatus.attachment.body, attachmentStatus.attachment.name, attachmentStatus.attachment.type);

		try {
			var sendStatus = yield inbox.send({
				body: $scope.form.body,
				attachmentIds: $scope.attachments.map(a => a.id),
				threadId
			}, manifest, keys);

			console.log('compose send status', sendStatus);

			if (isSecured) {
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
					subject: `Re: ${Email.getSubjectWithoutRe(thread.subject)}`,
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

	$scope.tagClicked = (select, item, model) => {
		const index = model.findIndex(c => c.email == item.email);
		if (index > -1) {
			const tag = item.getTag();
			if (tag) {
				model.splice(index, 1);
				select.search = item.getTag();
			}
		}
	};

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