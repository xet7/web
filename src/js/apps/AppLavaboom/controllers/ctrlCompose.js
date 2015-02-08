angular.module('AppLavaboom').controller('CtrlCompose', function($scope, $stateParams, consts, co, user, contacts, inbox, router, Attachment, Contact) {
	$scope.isXCC = false;

	var threadId = $stateParams.threadId;
	var toEmail = $stateParams.to;

	$scope.attachments = [];

	var processAttachment = (attachmentStatus) => co(function *(){
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

	var deleteAttachment = (attachmentStatus, index) => co(function *(){
		attachmentStatus.isCancelled = true;

		try {
			yield attachmentStatus.processingPromise;
		} catch (err){
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
		if(_.startsWith(file.type, 'image')) return;
		var attachmentStatus = {
			attachment: new Attachment(file)
		};
		attachmentStatus.processingPromise = processAttachment(attachmentStatus);
		$scope.attachments.push(attachmentStatus);
	};

	$scope.deleteAttachment = (attachmentStatus, index) => deleteAttachment(attachmentStatus, index);

	$scope.send = () => co(function *(){
		console.log('waiting for uploads to complete...');

		yield $scope.attachments.map(a => a.processingPromise);

		console.log('uploads completed...');

		console.log($scope.form);

		yield inbox.send(
			$scope.form.selected.to.map(e => e.email),
			$scope.form.selected.cc.map(e => e.email),
			$scope.form.selected.bcc.map(e => e.email),
			$scope.form.subject,
			$scope.form.body,
			$scope.attachments.map(a => a.id),
			threadId
		);

		router.hidePopup();
	});



	$scope.$bind('contacts-changed', () => {
		var toEmailContact = toEmail ? new Contact({email: toEmail}) : null;

		$scope.people = contacts.people.concat(toEmailContact ? [toEmailContact] : []);

		var bindUserSignature = () => {
			if (user.settings.isSignatureEnabled && user.settings.signatureHtml)
				$scope.form.body = $scope.form.body + user.settings.signatureHtml;
		};

		if (threadId) {
			co(function *(){
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
				body: '<p>Dear Orwell</p><p>Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Sed porttitor lectus nibh. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Donec sollicitudin molestie malesuada. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Donec rutrum congue leo eget malesuada. Sed porttitor lectus nibh. Curabitur aliquet quam id dui posuere blandit. Nulla porttitor accumsan tincidunt.</p><blockquote><p>See, there never was actually any spoon. It was just lying around the production set.</p></blockquote><a href="mailto:aerials@soad.com">test mailto link</a>'
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
});
