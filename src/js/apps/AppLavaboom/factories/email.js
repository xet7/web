module.exports = /*@ngInject*/(co, crypto, user, Manifest) => {
	let Email = function(opt, manifest) {
		this.id =  opt.id;
		this.threadId = opt.thread;
		this.isEncrypted = opt.isEncrypted;
		this.subject = manifest ? manifest.subject : opt.name;
		if (!this.subject)
			this.subject = 'unknown subject';

		this.date = opt.date_created;
		this.manifest = manifest;
		this.files = manifest.files;

		this.from = manifest.from;
		this.fromAllPretty = manifest.from.map(e => e.prettyName).join(',');
		this.preview = opt.preview;
		this.body = opt.body;
		this.attachments = opt.attachments ? opt.attachments : [];
	};

	Email.toEnvelope = ({body, attachmentIds, threadId}, manifest, keys) => co(function *() {
		if (manifest && manifest.isValid && !manifest.isValid())
			throw new Error('invalid manifest');

		if (!attachmentIds)
			attachmentIds = [];
		if (!threadId)
			threadId = null;

		let isSecured = !Object.keys(keys).some(e => !keys[e]);

		if (isSecured) {
			keys[user.email] = user.key.key;
			let publicKeysValues = Object.keys(keys).filter(e => keys[e]).map(e => keys[e]);
			let publicKeys = [...publicKeysValues];

			let manifestString = manifest.stringify();

			let [envelope, manifestEncoded] = yield [
				crypto.encodeEnvelopeWithKeys({data: body}, publicKeys, 'body', 'body'),
				crypto.encodeWithKeys(manifestString, publicKeys)
			];

			return angular.extend({}, envelope, {
				kind: 'manifest',
				manifest: manifestEncoded.pgpData,

				to: manifest.to,
				cc: manifest.cc,
				bcc: manifest.bcc,

				files: attachmentIds,
				thread: threadId
			});
		}

		return {
			kind: 'raw',
			content_type: 'text/html',

			to: manifest.to,
			cc: manifest.cc,
			bcc: manifest.bcc,
			subject: manifest.subject,
			body: body,

			files: attachmentIds,
			thread: threadId
		};
	});

	Email.fromEnvelope = (envelope) => co(function *() {
		let [body, manifestRaw] = [null, null];

		try {
			let [bodyData, manifestRawData] = yield [
				crypto.decodeRaw(envelope.body),
				crypto.decodeRaw(envelope.manifest)
			];
			body = {state: 'ok', data: bodyData};
			manifestRaw = manifestRawData;
		} catch (err) {
			console.error('Email.fromEnvelope decrypt error', err);
			body = {state: err.message, data: ''};
		}

		let email = new Email(angular.extend({}, envelope, {
			isEncrypted: true,
			body: body,
			preview: body
		}), manifestRaw ? Manifest.createFromJson(manifestRaw) : null);

		console.log('email decoded', email, manifestRaw);

		return email;
	});

	return Email;
};