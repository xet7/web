module.exports = /*@ngInject*/($injector, $rootScope, $translate, co, user, crypto, Manifest) => {
	let translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_AND_ONE_OTHER = $translate.instant('LOADER.LB_AND_ONE_OTHER');
		translations.LB_AND_TWO_OTHERS = $translate.instant('LOADER.LB_AND_TWO_OTHERS');
		translations.LB_AND_OTHERS = $translate.instant('LOADER.LB_AND_OTHERS');
	});

	let Thread = function(opt, manifest, labels) {
		let self = this;
		let inbox = $injector.get('inbox');

		this.id = opt.id;
		this.subject = manifest && manifest.subject ? manifest.subject : opt.name;

		this.created = opt.date_created;
		this.modified = opt.date_modified;
		this.members = opt.members;
		this.labels = opt.labels;
		this.attachmentsCount = opt.attachments_count;

		this.isLabel = (labelName) => this.labels.some(lid => labels.byId[lid] && labels.byId[lid].name == labelName);
		this.addLabel = (labelName) => {
			return _.union(self.labels, [labels.byName[labelName].id]);
		};

		this.removeLabel = (labelName) => {
			return self.labels.filter(x => x != labels.byName[labelName].id);
		};

		this.isRead = opt.is_read;
		this.isEncrypted = true;
	};

	Thread.fromEnvelope = (envelope) => co(function *() {
		let inbox = $injector.get('inbox');

		let manifestRaw = yield co.def(crypto.decodeRaw(envelope.manifest), null);

		const labels = yield inbox.getLabels();

		console.log('thread manifest', manifestRaw);

		return new Thread(envelope, manifestRaw ? Manifest.createFromJson(manifestRaw) : null, labels);
	});
	
	return Thread;
};