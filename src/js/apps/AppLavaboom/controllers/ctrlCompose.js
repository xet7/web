module.exports = /*@ngInject*/($rootScope, $scope, $stateParams, $translate, consts, co, user, contacts, inbox, router, Manifest, Attachment, Contact, Hotkey) => {
	$scope.isWarning = false;
	$scope.isXCC = false;
	$scope.toolbar = [
		['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
		['bold', 'italics'],
		['justifyLeft', 'justifyCenter', 'justifyRight']
	];

	var threadId = $stateParams.replyThreadId;
	var toEmail = $stateParams.to;

	$scope.attachments = [];

	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_PRIVATE = $translate.instant('MAIN.COMPOSE.LB_PRIVATE');
		translations.LB_BUSINESS = $translate.instant('MAIN.COMPOSE.LB_BUSINESS');
		translations.LB_HIDDEN = $translate.instant('MAIN.COMPOSE.LB_HIDDEN');
	});

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

		var sendStatus = yield inbox.send({
			body: $scope.form.body,
			attachmentIds: $scope.attachments.map(a => a.id),
			threadId
		}, manifest);

		console.log('compose send status', sendStatus);

		if (sendStatus.isEncrypted) {
			yield $scope.confirm();
		} else {
			$scope.isWarning = true;
		}
	});

	$scope.confirm = () => co(function *(){
		$scope.isWarning = false;

		yield inbox.confirmSend();

		yield manifest.getDestinationEmails()
			.filter(email => !contacts.getContactByEmail(email))
			.map(email => contacts.createContact(new Contact({
				isSecured: true,
				email
			})));

		manifest = null;

		router.hidePopup();
	});

	$scope.reject = () => {
		$scope.isWarning = false;

		inbox.rejectSend();
		manifest = null;
	};


	$scope.$bind('contacts-changed', () => {
		let toEmailContact = toEmail ? new Contact({email: toEmail}) : null;

		$scope.people = [...contacts.people.values()].reduce((a, c) => {
			if (c.privateEmails)
				c.privateEmails.forEach(e => {
					let newContact = angular.copy(c);
					newContact.label = translations.LB_PRIVATE;
					newContact.email = e.email;
					a.push(newContact);
				});

			if (c.businessEmails)
				c.businessEmails.forEach(e => {
					let newContact = angular.copy(c);
					newContact.label = translations.LB_BUSINESS;
					newContact.email = e.email;
					a.push(newContact);
				});

			if (c.email) {
				let newContact = angular.copy(c);
				newContact.label = translations.LB_HIDDEN;
				newContact.email = c.email;
				a.push(newContact);
			}

			return a;
		}, []).concat(toEmailContact ? [toEmailContact] : []);

		let bindUserSignature = () => {
			if (user.settings.isSignatureEnabled && user.settings.signatureHtml)
				$scope.form.body = $scope.form.body + user.settings.signatureHtml;
		};

		if (threadId) {
			co(function *() {
				let thread = yield inbox.getThreadById(threadId);

				$scope.form = {
					person: {},
					selected: {
						to: thread.members[0],
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

	$scope.tagTransform = function (newTag) {
		let p = newTag.split('@');
		if (p.length > 1)
			return {
				name: p[0].trim(),
				email: `${p[0].trim()}@${p[1].trim()}`,
				sec: 1
			};

		return {
			name: newTag.trim(),
			email: `${newTag.trim()}@${consts.ROOT_DOMAIN}`,
			sec: 1
		};
	};

    // Add hotkeys
	Hotkey.addHotkey({
        combo: ['ctrl+enter', 'command+enter'],
        description: 'Send an email',
        callback: (event, key) => {
            event.preventDefault();
            $scope.send();
        },
        allowIn: ['INPUT', 'SELECT', 'TEXTAREA', 'P', 'DIV']
    });
};