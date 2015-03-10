module.exports = /*@ngInject*/(co, user, crypto, utils, fileReader, Email) => {
	var Attachment = function(file) {
		const self = this;

		angular.extend(this, {
			id: utils.hexify(openpgp.crypto.random.getRandomBytes(16)),
			type: file.type,
			name: file.name,
			dateModified: new Date(file.lastModifiedDate),
			body: '',
			size: 0
		});

		this.read = () => co(function* (){
			self.body = yield fileReader.readAsText(file);
			self.size = self.body ? self.body.length : 0;
		});
	};

	Attachment.toEnvelope = (attachment, keys) => co(function *() {
		const isSecured = Email.isSecuredKeys(keys);

		if (isSecured)
			keys[user.email] = user.key.key;
		const publicKeys = isSecured ? Email.keysMapToList(keys) : [];

		const envelope = yield crypto.encodeEnvelopeWithKeys({
			data: attachment.body
		}, publicKeys, 'data');
		envelope.name = isSecured ? attachment.id + '.pgp' : attachment.name;

		return envelope;
	});

	Attachment.fromEnvelope = (envelope) => co(function *() {
		var data = yield crypto.decodeEnvelope(envelope, 'data');

		switch (data.majorVersion) {
			default:
				return new Attachment(angular.extend({}, {
					id: envelope.id,
					name: envelope.name,
					dateCreated: envelope.date_created,
					dateModified: envelope.date_modified
				}, data.data));
		}
	});

	return Attachment;
};