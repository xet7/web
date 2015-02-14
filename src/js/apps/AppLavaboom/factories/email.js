var chan = require('chan');

module.exports = /*@ngInject*/(co, contacts, crypto) => {
	var Email = function(opt) {
		this.id =  opt.id;
		this.threadId = opt.thread;
		this.isEncrypted = opt.isEncrypted;
		this.subject = opt.name;
		this.date = opt.date_created;
		this.from = opt.from;

		var fromContact = contacts.getContactByEmail(opt.from);

		this.fromName = fromContact ? fromContact.name : opt.from;
		this.preview = opt.preview;
		this.body = opt.body;
		this.attachments = opt.attachments;
	};

	Email.fromEnvelope = (envelope) => co(function *() {
		var ch = chan();
		var isPreviewAvailable = !!envelope.preview;

		var [bodyData, previewData] = yield [
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