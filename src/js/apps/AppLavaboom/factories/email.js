module.exports = /*@ngInject*/(co, contacts, crypto, user, Manifest, LavaboomAPI) => {
	let Email = function(opt, manifest) {
		this.id =  opt.id;
		this.threadId = opt.thread;
		this.isEncrypted = opt.isEncrypted;
		this.subject = manifest ? manifest.subject : opt.name;
		if (!this.subject)
			this.subject = 'unknown subject';

		this.date = opt.date_created;
		this.from = angular.isArray(opt.from) ? opt.from : [opt.from];
		this.manifest = manifest;
		this.files = manifest.parts.filter(p => p.id != 'body');

		let fromContact = contacts.getContactByEmail(opt.from);

		this.fromName = fromContact ? fromContact.name : opt.from;
		this.preview = opt.preview;
		this.body = opt.body;
		this.attachments = opt.attachments ? opt.attachments : [];
	};

	Email.toEnvelope = ({body, attachmentIds, threadId}, manifest) => co(function *() {
		if (!manifest)
			throw new Error('manifest required');
		if (!manifest.isValid())
			throw new Error('invalid manifest');

		if (!attachmentIds)
			attachmentIds = [];
		if (!threadId)
			threadId = null;

		let res = yield manifest.to.map(toEmail => LavaboomAPI.keys.get(toEmail));
		let publicKeysValues = new Map([user.key, ...res.map(r => r.body.key)].map(k => [k.id, k.key])).values();
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
	});

	Email.fromEnvelope = (envelope) => co(function *() {
		let [body, manifestRaw] = [null, null];

		try {
			let [bodyData, manifestRawData] = yield [
				crypto.decodeByListedFingerprints(envelope.body, envelope.pgp_fingerprints),
				crypto.decodeByListedFingerprints(envelope.manifest, envelope.pgp_fingerprints)
			];
			body = {state: 'ok', data: bodyData};
			manifestRaw = manifestRawData;
		} catch (err) {
			console.error('Email.fromEnvelope decrypt error', err);
			body = {state: err.message, data: ''};
		}

		let email = new Email(angular.extend({}, envelope, {
			isEncrypted: envelope.pgp_fingerprints.length > 0,
			body: body,
			preview: body
		}), manifestRaw ? Manifest.createFromJson(manifestRaw) : null);

		console.log('email decoded', email);

		return email;
	});

	return Email;
};