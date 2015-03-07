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
		this.files = manifest ? manifest.files : [];

		this.from = manifest ? manifest.from
			: (angular.isArray(opt.from) ? opt.from : [opt.from]);
		this.fromAllPretty = manifest ? manifest.from.map(e => e.prettyName).join(',')
			: (angular.isArray(opt.from) ? opt.from.join(',') : opt.from);
		this.preview = opt.preview;
		this.body = opt.body;
		this.attachments = opt.attachments ? opt.attachments : [];
	};

	Email.isSecuredKeys = (keys) => !Object.keys(keys).some(e => !keys[e]);

	Email.keysMapToList = (keys) => {
		const publicKeysValues = Object.keys(keys).filter(e => keys[e]).map(e => keys[e]);

		return [...publicKeysValues];
	};

	Email.toEnvelope = ({body, attachmentIds, threadId}, manifest, keys) => co(function *() {
		if (manifest && manifest.isValid && !manifest.isValid())
			throw new Error('invalid manifest');

		if (!attachmentIds)
			attachmentIds = [];
		if (!threadId)
			threadId = null;

		let isSecured = Email.isSecuredKeys(keys);

		if (isSecured) {
			keys[user.email] = user.key.key;
			let publicKeys = Email.keysMapToList(keys);

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
				subject_hash: openpgp.util.hexstrdump(openpgp.crypto.hash.sha256(manifest.subject)),

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
			subject_hash: openpgp.util.hexstrdump(openpgp.crypto.hash.sha256(manifest.subject)),
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