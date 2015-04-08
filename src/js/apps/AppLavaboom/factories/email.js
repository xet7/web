module.exports = /*@ngInject*/(co, crypto, user, Manifest) => {
	const reRegex =
		/([\[\(] *)?(RE?S?|FYI|RIF|I|FS|VB|RV|ENC|ODP|PD|YNT|ILT|SV|VS|VL|AW|WG|ΑΠ|ΣΧΕΤ|ΠΡΘ|תגובה|הועבר|主题|转发|FWD?) *([-:;)\]][ :;\])-]*|$)|\]+ *$/i;

	function Email (opt, manifest) {
		const self = this;

		this.id =  opt.id;
		this.threadId = opt.thread;
		this.date = opt.date_created;

		this.manifest = manifest;
		this.subject = manifest ? manifest.subject : opt.name;
		this.files = manifest ? manifest.files : [];

		const prettify = (a) => a.map(e => e.prettyName).join(',');

		this.from = manifest ? manifest.from : Manifest.parseAddresses(opt.from);
		this.fromAllPretty = prettify(self.from);

		this.to = manifest ? manifest.to : [];
		this.toPretty = prettify(self.to);

		this.cc = manifest ? manifest.cc : [];
		this.ccPretty = prettify(self.cc);

		this.bcc = manifest ? manifest.bcc : [];
		this.bccPretty = prettify(self.bcc);

		this.preview = opt.preview;
		this.body = opt.body;
		this.attachments = opt.attachments ? opt.attachments : [];
	}

	Email.getSubjectWithoutRe = (subject) => subject.replace(reRegex, '');

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

		const subjectHash = openpgp.util.hexstrdump(openpgp.crypto.hash.sha256(Email.getSubjectWithoutRe(manifest.subject)));

		if (isSecured) {
			keys[user.email] = user.key.key;
			let publicKeys = Email.keysMapToList(keys);

			console.log('Email.toEnvelope keys', keys, publicKeys);

			let manifestString = manifest.stringify();

			let [envelope, manifestEncoded] = yield [
				crypto.encodeEnvelopeWithKeys({data: body}, publicKeys, 'body', 'body'),
				crypto.encodeWithKeys(manifestString, publicKeys)
			];

			return angular.extend({}, envelope, {
				kind: 'manifest',
				manifest: manifestEncoded.pgpData,

				to: manifest.to.map(e => e.address),
				cc: manifest.cc.map(e => e.address),
				bcc: manifest.bcc.map(e => e.address),
				subject_hash: subjectHash,

				files: attachmentIds,
				thread: threadId
			});
		}

		return {
			kind: 'raw',
			content_type: 'text/html',

			to: manifest.to.map(e => e.address),
			cc: manifest.cc.map(e => e.address),
			bcc: manifest.bcc.map(e => e.address),
			subject: manifest.subject,
			subject_hash: subjectHash,
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
			body: body,
			preview: body
		}), manifestRaw ? Manifest.createFromJson(manifestRaw) : null);

		console.log('email decoded', email, manifestRaw);

		return email;
	});

	return Email;
};