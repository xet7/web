angular.module(primaryApplicationName).factory('Attachment',
	function(co, user, crypto, fileReader) {
		var Attachment = function(file) {
			var self = this;

			angular.extend(this, {
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

		var secureFields = ['dateModified', 'body', 'type'];

		Attachment.toEnvelope = (attachment) => co(function *() {
			var envelope = yield crypto.encodeEnvelopeWithKeys({
				data: secureFields.reduce((a, field) => {
					a[field] = attachment[field];
					return a;
				}, {}),
				encoding: 'json'
			}, [user.key.key], 'data');
			envelope.name = attachment.name;

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
	});