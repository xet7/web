module.exports = /*@ngInject*/($injector, $translate, co, utils, crypto, user, Email, Manifest) => {
	const translations = {
		LB_EMAIL_TO_YOURSELF: ''
	};
	$translate.bindAsObject(translations, 'INBOX');

	function Thread(opt, manifest, labels) {
		const self = this;
		let isLoaded = false;
		
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
		
		this.setupManifest = (manifest, setIsLoaded = false) => {
			isLoaded = setIsLoaded;
			self.id = opt.id;
			self.created = opt.date_created;
			self.modified = opt.date_modified;

			self.members = opt.members ? filterMembers(Manifest.parseAddresses(opt.members)) : [];
			self.membersPretty = prettify(self.members);

			self.to = manifest ? manifest.to : [];

			self.labels = opt.labels;
			self.isRead = opt.is_read;
			self.secure = opt.secure;

			self.subject = manifest && manifest.subject ? manifest.subject : opt.subject;
			if (!self.subject)
				self.subject = '';

			self.attachmentsCount = manifest && manifest.files ? manifest.files.length : 0;

			self.isReplied = opt.emails.length > 1;
			self.isForwarded = Email.getSubjectWithoutRe(self.subject) != self.subject;
		};
		
		this.isLoaded = () => isLoaded;
		this.isLabel = (labelName) => self.labels.some(lid => labels.byId[lid] && labels.byId[lid].name == labelName);
		this.addLabel = (labelName) => utils.uniq(self.labels.concat(labels.byName[labelName].id));
		this.removeLabel = (labelName) => self.labels.filter(x => x != labels.byName[labelName].id);

		self.setupManifest(manifest);
	}

	Thread.fromEnvelope = (envelope) => co(function *() {
		let inbox = $injector.get('inbox');
		let labels = yield inbox.getLabels();
		
		let thread = new Thread(envelope, null, labels);

		co(function *(){
			let manifestRaw = yield co.def(crypto.decodeRaw(envelope.manifest), null);
			console.log('thread manifest', manifestRaw);
			thread.setupManifest(manifestRaw ? Manifest.createFromJson(manifestRaw) : null, true);
		});

		return thread;
	});
	
	return Thread;
};