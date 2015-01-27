angular.module(primaryApplicationName).factory('Contact', function(co, user, crypto) {
	var Contact = function(opt) {
		if (opt.isSecured === undefined)
			opt.isSecured = false;
		angular.extend(this, opt);
		this.sec = opt.isSecured ? 1 : 0;
	};

	var secureFields = ['email', 'phone', 'url', 'notes', 'isSecured'];

	Contact.toEnvelope = (contact) => co(function *() {
		var envelope = yield crypto.encodeEnvelopeWithKeys({
			data: secureFields.reduce((a, field) => {
				a[field] = contact[field];
				return a;
			}, {}),
			encoding: 'json'
		}, [user.key.key], 'data');
		envelope.name = contact.name;

		return envelope;
	});

	Contact.fromEnvelope = (envelope) => co(function *() {
		var data;

		try {
			data = yield crypto.decodeEnvelope(envelope, 'data');
		} catch (error) {
			console.error(error);
			data = null;
		}

		switch (data.majorVersion) {
			default:
				return new Contact(angular.extend({}, {
					id: envelope.id,
					name: envelope.name,
					isSecured: true,
					dateCreated: envelope.date_created,
					dateModified: envelope.date_modified
				}, data.data));
		}
	});

	return Contact;
});