module.exports = /*@ngInject*/($injector, $translate, co, utils, crypto, user, Email, Manifest) => {
	const translations = {
		LB_EMAIL_TO_YOURSELF: ''
	};
	$translate.bindAsObject(translations, 'INBOX');

	function Thread(opt, manifest, labels) {
		const self = this;

		this.id = opt.id;
		this.created = opt.date_created;
		this.modified = opt.date_modified;

		const prettify = (a) => {
			let r = a
				.map(e => e.address == user.email ? '' : e.prettyName)
				.filter(e => !!e);

			if (r.length < 1)
				r = [translations.LB_EMAIL_TO_YOURSELF];

			return r;
		};

		const filterMembers = (members) => {
			let myself = null;
			members = members.
				map(e => {
					if (e.address == user.email){
						myself = e;
						return null;
					}
					return e;
				})
				.filter(e => !!e);

			if (members.length < 1 && myself)
				members = [myself];

			return members;
		};

		this.members = opt.members ? filterMembers(Manifest.parseAddresses(opt.members)) : [];
		this.membersPretty = prettify(self.members);

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