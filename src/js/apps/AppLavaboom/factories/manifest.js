module.exports = /*@ngInject*/(contacts) => {
	const hash = (data) => openpgp.util.hexstrdump(openpgp.crypto.hash.sha256(data));

	const ManifestPart = function (manifestPart) {
		const self = this;

		this.id = manifestPart.id;
		this.size = manifestPart.size;
		this.filename = manifestPart.filename;
		this.hash = manifestPart.hash;

		this.isValid = (body) => body.length == self.size && hash(body) == self.hash;

		// hack
		const contentType = manifestPart.content_type || manifestPart['content-type'];
		if (contentType) {
			this.contentType = (contentType.defaultValue ? contentType.defaultValue : contentType).toLowerCase();
			this.charset = (contentType.charset ? contentType.charset : 'utf-8').toLowerCase();
		} else {
			this.contentType = 'text/plain';
			this.charset = 'utf-8';
		}

		this.isHtml = () => self.contentType.includes('/html');
	};

	const Manifest = function (manifest) {
		const self = this;

		const formatFrom = (fromAddress) => {
			const address = fromAddress.address ? fromAddress.address : fromAddress;
			const fromContact = contacts.getContactByEmail(address);
			const name = fromAddress.name ? fromAddress.name : (fromContact ? fromContact.getFullName() : '');
			return {
				address,
				name,
				prettyName: address + (name ? ` (${name})` : '')
			};
		};

		this.from = angular.isArray(manifest.headers.from) ? manifest.headers.from.map(e => formatFrom(e)) : [formatFrom(manifest.headers.from)];

		this.to = manifest.headers.to;
		this.cc = manifest.headers.cc ? manifest.headers.cc : [];
		this.bcc = manifest.headers.bcc ? manifest.headers.bcc : [];
		this.subject = manifest.headers.subject;

		this.getDestinationEmails = () => {
			let emails = new Set([
				...self.to,
				...self.cc,
				...self.bcc
			]).values();

			return [...emails];
		};

		this.getFileById = (id) => manifest.parts.find(p => p.id == id);
		
		this.setBody = (data, contentType) => {
			manifest.parts.push({
				id: 'body',
				hash: hash(data),
				content_type: contentType
			});
		};

		this.getPart = (id = 'body') => {
			return new ManifestPart(manifest.parts.find(p => p.id == id));
		};

		this.files = manifest.parts.filter(p => p.id != 'body').map(p => new ManifestPart(p));

		this.addAttachment = (id, data, fileName, contentType) => {
			manifest.parts.push({
				id: id,
				hash: hash(data),
				filename: fileName,
				content_type: contentType ? contentType : 'application/octet-stream',
				charset: 'urf-8',
				size: data.length
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