module.exports = /*@ngInject*/($injector, co, utils, crypto, Manifest) => {
	function Thread(opt, manifest, labels) {
		const self = this;

		this.id = opt.id;
		this.created = opt.date_created;
		this.modified = opt.date_modified;
		this.members = opt.members;
		this.labels = opt.labels;
		this.isRead = opt.is_read;
		this.secure = opt.secure;

		this.subject = manifest && manifest.subject ? manifest.subject : opt.name;
		this.attachmentsCount = manifest && manifest.files ? manifest.files.length : 0;

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