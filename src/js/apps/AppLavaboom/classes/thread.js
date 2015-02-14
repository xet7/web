angular.module(primaryApplicationName).factory('Thread',
	function($injector, $rootScope, $translate) {
		var translations = {};

		$rootScope.$bind('$translateChangeSuccess', () => {
			translations.LB_AND_ONE_OTHER = $translate.instant('LOADER.LB_AND_ONE_OTHER');
			translations.LB_AND_TWO_OTHERS = $translate.instant('LOADER.LB_AND_TWO_OTHERS');
			translations.LB_AND_OTHERS = $translate.instant('LOADER.LB_AND_OTHERS');
		});

		return function(opt) {
			var self = this;
			var inbox = $injector.get('inbox');

			this.id = opt.id;
			this.subject = opt.name;
			this.created = opt.date_created;
			this.modified = opt.date_modified;
			this.members = opt.members;
			this.labels = opt.labels;
			this.attachmentsCount = opt.attachments_count;

			this.isLabel = (labelName) => this.labels.some(lid => inbox.labelsById[lid] && inbox.labelsById[lid].name == labelName);
			this.addLabel = (labelName) => {
				return _.union(self.labels, [inbox.labelsByName[labelName].id]);
			};

			this.removeLabel = (labelName) => {
				return self.labels.filter(x => x != inbox.labelsByName[labelName].id);
			};

			this.isRead = opt.is_read;
			this.isEncrypted = true;
		};
	});