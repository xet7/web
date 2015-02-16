module.exports = /*@ngInject*/($rootScope, $scope, $stateParams, $translate, consts, co, user, contacts, inbox, router, Attachment, Contact) => {
	$scope.isXCC = false;

	var threadId = $stateParams.replyThreadId;
	var toEmail = $stateParams.to;

	$scope.attachments = [];

	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_PRIVATE = $translate.instant('MAIN.COMPOSE.LB_PRIVATE');
		translations.LB_BUSINESS = $translate.instant('MAIN.COMPOSE.LB_BUSINESS');
		translations.LB_HIDDEN = $translate.instant('MAIN.COMPOSE.LB_HIDDEN');
	});

	/*var processAttachment = (attachmentStatus) => co(function *() {
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
			attachmentStatus.ext = attachmentStatus.attachment.type.split("/")[0];
		} catch (err) {
			attachmentStatus.ext = "file";
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
			attachmentStatus.id = r.body.attachment.id;
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

	$scope.deleteAttachment = (attachmentStatus, index) => deleteAttachment(attachmentStatus, index);*/

	$scope.send = () => co(function *() {
		yield $scope.attachments.map(a => a.processingPromise);

		let to = $scope.form.selected.to.map(e => e.email),
			cc = $scope.form.selected.cc.map(e => e.email),
			bcc = $scope.form.selected.bcc.map(e => e.email);

		yield inbox.send({
			to,
			cc,
			bcc,
			subject: $scope.form.subject,
			body: $scope.form.body,
			attachmentIds: $scope.attachments.map(a => a.id),
			threadId
		});

		let emails = new Set([
			...to,
			...cc,
			...bcc
		]).values();

		yield [...emails]
			.filter(email => !contacts.getContactByEmail(email))
			.map(email =>
				contacts.createContact(new Contact({
					isSecured: true,
					email
				}))
		);

		router.hidePopup();
	});


	$scope.$bind('contacts-changed', () => {
		var toEmailContact = toEmail ? new Contact({email: toEmail}) : null;

		$scope.people = contacts.peopleList.reduce((a, c) => {
			if (c.privateEmails)
				c.privateEmails.forEach(e => {
					var newContact = angular.copy(c);
					newContact.label = translations.LB_PRIVATE;
					newContact.email = e.email;
					a.push(newContact);
				});

			if (c.businessEmails)
				c.businessEmails.forEach(e => {
					var newContact = angular.copy(c);
					newContact.label = translations.LB_BUSINESS;
					newContact.email = e.email;
					a.push(newContact);
				});

			if (c.email) {
				var newContact = angular.copy(c);
				newContact.label = translations.LB_HIDDEN;
				newContact.email = c.email;
				a.push(newContact);
			}

			return a;
		}, []).concat(toEmailContact ? [toEmailContact] : []);

		var bindUserSignature = () => {
			if (user.settings.isSignatureEnabled && user.settings.signatureHtml)
				$scope.form.body = $scope.form.body + user.settings.signatureHtml;
		};

		if (threadId) {
			co(function *() {
				var thread = yield inbox.getThreadById(threadId);

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
					to: toEmailContact ? [toEmailContact] : [contacts.myself],
					cc: [],
					bcc: [],
					from: contacts.myself
				},
				fromEmails: [contacts.myself],
				subject: 'Test subject',
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
		var p = newTag.split('@');
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
};