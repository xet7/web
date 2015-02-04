angular.module(primaryApplicationName).factory('Thread', function($rootScope, co, contacts, $translate) {
	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_AND_ONE_OTHER = $translate.instant('LOADER.LB_AND_ONE_OTHER');
		translations.LB_AND_TWO_OTHERS = $translate.instant('LOADER.LB_AND_TWO_OTHERS');
		translations.LB_AND_OTHERS = $translate.instant('LOADER.LB_AND_OTHERS');
	});

	var Thread = function(opt) {
		this.id = opt.id;
		this.subject = opt.name;
		this.created = opt.date_created;
		this.modified = opt.date_modified;
		this.members = opt.members;
		this.labels = opt.labels;
		this.attachmentsCount = opt.attachments_count;

		this.isRead = opt.is_read;
		this.isEncrypted = true;
	};

	return Thread;
});