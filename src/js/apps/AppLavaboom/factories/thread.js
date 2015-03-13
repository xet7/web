module.exports = /*@ngInject*/($injector, co, utils, crypto, Manifest) => {
	function Thread(opt, manifest, labels) {
		const self = this;

		this.id = opt.id;
		this.subject = manifest && manifest.subject ? manifest.subject : opt.name;

		this.created = opt.date_created;
		this.modified = opt.date_modified;
		this.members = opt.members;
		this.labels = opt.labels;
		this.attachmentsCount = opt.attachments_count;

		this.isLabel = (labelName) => this.labels.some(lid => labels.byId[lid] && labels.byId[lid].name == labelName);
		this.addLabel = (labelName) => utils.uniq(self.labels.concat([labels.byName[labelName].id]));

		this.removeLabel = (labelName) => {
			return self.labels.filter(x => x != labels.byName[labelName].id);
		};

		this.isRead = opt.is_read;
		this.secure = opt.secure;
	}

	Thread.fromEnvelope = (envelope) => co(function *() {
		const inbox = $injector.get('inbox');

		const manifestRaw = yield co.def(crypto.decodeRaw(envelope.manifest), null);

		const labels = yield inbox.getLabels();

		console.log('thread manifest', manifestRaw);

		return new Thread(envelope, manifestRaw ? Manifest.createFromJson(manifestRaw) : null, labels);
	});
	
	return Thread;
};