angular.module(primaryApplicationName).factory('Label', function() {
	var classes = {
		'Drafts': 'draft',
		'Spam': 'ban',
		'Starred': 'star'
	};

	var Label = function(opt) {
		this.id = opt.id;
		this.name = opt.name;
		this.created = opt.date_created;
		this.modified = opt.date_modified;
		this.emailsTotal = opt.emails_total;
		this.emailsUnread = opt.emails_unread;
		this.isBuiltin = opt.builtin;

		this.iconClass = `icon-${classes[this.name] ? classes[this.name] : this.name.toLowerCase()}`;
	};

	return Label;
});