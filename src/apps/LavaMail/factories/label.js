module.exports = () => {
	const classes = {
		'Drafts': 'draft',
		'Spam': 'ban',
		'Starred': 'star-outline'
	};

	function Label (opt) {
		const self = this;

		this.id = opt.id;
		this.name = opt.name;
		this.lname = opt.name.toLowerCase();
		this.created = opt.date_created;
		this.modified = opt.date_modified;
		this.emailsTotal = opt.emails_total;
		this.isBuiltin = opt.builtin;

		this.iconClass = `icon-${classes[this.name] ? classes[this.name] : this.name.toLowerCase()}`;

		const unreadFromServer = opt.unread_threads_count;
		const unreadThreads = {};
		const readThreads = {};

		this.threadsUnread = unreadFromServer;

		this.addUnreadThreadId = (tid) => {
			unreadThreads[tid] = true;
			self.threadsUnread = unreadFromServer + Object.keys(unreadThreads).length;
		};

		this.addReadThreadId = (tid) => {
			delete unreadThreads[tid];
			self.threadsUnread = unreadFromServer + Object.keys(unreadThreads).length;
		};
	}


	return Label;
};