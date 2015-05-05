function Entry (name, message, objects, stacktrace = null) {
	const self = this;

	self.date = new Date();
	self.stacktrace = stacktrace ? stacktrace : printStackTrace().slice(2);

	self.type = name;
	self.message = message;
	self.objects = objects.map(o => {
		try {
			return JSON.stringify(o);
		} catch (err) {
			return '~~~';
		}
	});
}

module.exports = Entry;