module.exports = /*@ngInject*/() => {
	let Manifest = function (manifest) {
		let hash = (data) => openpgp.util.hexstrdump(openpgp.crypto.hash.sha256(data));

		let self = this;
		
		this.from = manifest.headers.from;
		this.to = manifest.headers.to;
		this.cc = manifest.headers.cc ? manifest.headers.cc : [];
		this.bcc = manifest.headers.bcc ? manifest.headers.bcc : [];
		this.subject = manifest.headers.subject;
		this.parts = manifest.parts;

		this.getDestinationEmails = () => {
			let emails = new Set([
				...self.to,
				...self.cc,
				...self.bcc
			]).values();

			return [...emails];
		};

		this.getFileById = (id) => self.parts.find(p => p.id == id);
		
		this.setBody = (data, contentType) => {
			manifest.parts.push({
				id: 'body',
				hash: hash(data),
				content_type: contentType
			});
		};

		this.addAttachment = (id, data, fileName, contentType) => {
			manifest.parts.push({
				id: id,
				hash: hash(data),
				filename: fileName,
				content_type: contentType ? contentType : 'application/octet-stream',
				charset: 'urf-8',
				filesize: data.length
			});
		};

		this.isValid = () => {
			return !!manifest.parts.find(p => p.id == 'body');
		};

		this.stringify = () => JSON.stringify(manifest);
	};

	Manifest.defaultVersion = '1.0.0';

	Manifest.create = ({fromEmail, to, cc, bcc, subject}) => {
		let manifest = {
			version: Manifest.defaultVersion,
			headers: {
				from: fromEmail,
				to,
				subject: subject
			},
			parts: []
		};

		if (cc && cc.length > 0)
			manifest.headers.cc = cc;

		if (bcc && bcc.length > 0)
			manifest.headers.bcc = bcc;

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