var chan = require('chan');

angular.module(primaryApplicationName).factory('Email', function(co, contacts, crypto) {
	var Email = function(opt) {
		this.id =  opt.id;
		this.isEncrypted = opt.isEncrypted;
		this.subject = opt.name;
		this.date = opt.date_created;
		this.from = opt.from;
		this.fromName = contacts.getContactByEmail(opt.from).name;
		this.preview = opt.preview;
		this.body = opt.body;
		this.attachments = opt.attachments;
	};

	Email.fromEnvelope = (envelope) => co(function *() {
		var ch = chan();
		var isPreviewAvailable = !!envelope.preview;

		var t = yield [
			co.transform(crypto.decodeEnvelope(envelope.body, '', 'raw'), r => {
				if (!isPreviewAvailable)
					ch(r);
				return r;
			}),
			isPreviewAvailable ? crypto.decodeEnvelope(envelope.preview, '', 'raw') : ch
		];
		var bodyData = t[0], previewData = t[1];

		switch (bodyData.majorVersion) {
			default:
				return new Email(angular.extend({}, envelope, {
					isEncrypted: envelope.body.pgp_fingerprints.length > 0 || (envelope.preview && envelope.preview.pgp_fingerprints.length) > 0,
					body: bodyData,
					preview: previewData
				}));
		}

		return null;
	});

	return Email;
});