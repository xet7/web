module.exports = /*@ngInject*/($injector, co, utils, crypto, user, Email, Manifest) => {
	function Thread(opt, manifest, labels) {
		const self = this;
		let inbox = $injector.get('Email');

		this.id = opt.id;
		this.created = opt.date_created;
		this.modified = opt.date_modified;
		this.members = opt.members
			.map(address => address == user.email ? '' : Manifest.formatAddress(address).contactPrettyName)
			.filter(m => !!m);
		this.to = manifest ? manifest.to : [];

		this.labels = opt.labels;
		this.isRead = opt.is_read;
		this.secure = opt.secure;

		this.subject = manifest && manifest.subject ? manifest.subject : opt.name;
		this.attachmentsCount = manifest && manifest.files ? manifest.files.length : 0;

		this.isReplied = opt.emails.length > 1;
		this.isForwarded = Email.getSubjectWithoutRe(self.subject) != self.subject;

		this.isLabel = (labelName) => self.labels.some(lid => labels.byId[lid] && labels.byId[lid].name == labelName);
		this.addLabel = (labelName) => utils.uniq(self.labels.concat(labels.byName[labelName].id));
		this.removeLabel = (labelName) => self.labels.filter(x => x != labels.byName[labelName].id);
	}

	Thread.fromEnvelope = (envelope) => co(function *() {
		const inbox = $injector.get('inbox');
		const labels = yield inbox.getLabels();

		const manifestRaw = yield co.def(crypto.decodeRaw(envelope.manifest), null);

		console.log('thread manifest', manifestRaw);

		return new Thread(envelope, manifestRaw ? Manifest.createFromJson(manifestRaw) : null, labels);
	});
	
	return Thread;
};