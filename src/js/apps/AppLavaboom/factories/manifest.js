module.exports = /*@ngInject*/(co, crypto, user, LavaboomAPI) => {
	let Manifest = function (manifest) {
		let generateId = () => openpgp.util.hexstrdump(openpgp.crypto.random.getRandomBytes(16));
		let hash = (data) => openpgp.util.hexstrdump(openpgp.crypto.hash.sha256(data));

		let self = this;
		
		this.from = manifest.from;
		this.to = manifest.to;
		this.cc = manifest.cc ? manifest.cc : [];
		this.bcc = manifest.bcc ? manifest.bcc : [];
		this.subject = manifest.subject;

		this.getDestinationEmails = () => {
			let emails = new Set([
				...self.to,
				...self.cc,
				...self.bcc
			]).values();

			return [...emails];
		};
		
		this.setBody = (data, contentType) => {
			manifest.parts.push({
				id: 'body',
				hash: hash(data),
				'content-type': contentType
			});
		};

		this.addAttachment = (data, fileName, contentType) => {
			manifest.parts.push({
				id: generateId(),
				hash: hash(data),
				filename: fileName,
				'content-type': contentType,
				filesize: data.length
			});
		};

		this.isValid = () => {
			return !!manifest.parts.find(p => p.id == 'body');
		};

		this.stringify = () => JSON.stringify(manifest);
	};

	Manifest.defaultVersion = '1.0.0';

	//let manifest = Manifest.create({fromEmail: user.email, to, cc, bcc, subject});
	Manifest.create = ({fromEmail, to, cc, bcc, subject}) => {
		let manifest = {
			version: Manifest.defaultVersion,
			from: fromEmail,
			to,
			subject: subject,
			parts: []
		};

		if (cc && cc.length > 0)
			manifest.cc = cc;

		if (bcc && bcc.length > 0)
			manifest.bcc = bcc;

		return new Manifest(manifest);
	};

	Manifest.createFromJson = (manifest) => {
		let rawManifest;
		try {
			rawManifest = JSON.parse(manifest);
		} catch (error) {
			throw new Error('invalid manifest format!');
		}
		return new Manifest(rawManifest);
	};

	return Manifest;
};