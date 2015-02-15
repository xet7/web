let chan = require('chan');

module.exports = /*@ngInject*/(co, contacts, crypto, LavaboomAPI, user) => {
	let Email = function(opt) {
		this.id =  opt.id;
		this.threadId = opt.thread;
		this.isEncrypted = opt.isEncrypted;
		this.subject = opt.name;
		this.date = opt.date_created;
		this.from = opt.from;

		let fromContact = contacts.getContactByEmail(opt.from);

		this.fromName = fromContact ? fromContact.name : opt.from;
		this.preview = opt.preview;
		this.body = opt.body;
		this.attachments = opt.attachments;
	};

	Email.toEnvelope = ({to, subject, body, cc, bcc, attachmentIds, threadId}) => co(function *() {
		if (!cc)
			cc = [];
		if (!bcc)
			bcc = [];
		if (!attachmentIds)
			attachmentIds = [];
		if (!threadId)
			threadId = null;

		let res = yield to.map(toEmail => LavaboomAPI.keys.get(toEmail));
		let publicKeysValues = (new Map([user.key, ...res.map(r => r.body.key)].map(k => [k.id, k.key]))).values();

		let envelope = yield crypto.encodeEnvelopeWithKeys({data: body}, [...publicKeysValues], 'body', 'body');
		angular.extend(envelope, {
			to,
			cc,
			bcc,
			subject,
			attachments: attachmentIds,
			thread_id: threadId
		});

		return envelope;
	});

	Email.fromEnvelope = (envelope) => co(function *() {
		let ch = chan();
		let isPreviewAvailable = !!envelope.preview;

		let [bodyData, previewData] = yield [
			co.transform(crypto.decodeEnvelope(envelope.body, '', 'raw'), r => {
				if (!isPreviewAvailable)
					ch(r);
				return r;
			}),
			isPreviewAvailable ? crypto.decodeEnvelope(envelope.preview, '', 'raw') : ch
		];

		switch (bodyData.majorVersion) {
			default:
				return new Email(angular.extend({}, envelope, {
					isEncrypted: envelope.body.pgp_fingerprints.length > 0 ||
						(envelope.preview && envelope.preview.pgp_fingerprints.length) > 0,
					body: bodyData,
					preview: previewData
				}));
		}

		return null;
	});

	return Email;
};