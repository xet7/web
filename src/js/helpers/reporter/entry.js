const assetKeys = Object.keys(window.assets);

function Entry (name, message, objects, stacktrace) {
	const self = this;

	function compressStackTraceLine(str) {
		let x = str.substr(str.indexOf('@') + 1)
			.replace(window.location.toString(), '')
			.replace(window.location.protocol + '//' + window.location.host, '')
			.split(':');

		if (!x[0])
			return `/:${x[1]}:${x[2]}`;

		let file = x[0];

		let i = 0;
		for(let assetKey of assetKeys) {
			let asset = window.assets[assetKey];
			if (file.startsWith(asset)) {
				file = i + file.substr(asset.length);
				break;
			}

			i++;
		}
		return `${file}:${x[1]}:${x[2]}`;
	}

	var now = new Date();

	self.date = now.getTime();
	self.stacktrace = stacktrace.map(compressStackTraceLine).join(';');

	self.type = name;
	self.message = message;
	self.objects = objects.map(o => {
		try {
			JSON.stringify(o);
			return o;
		} catch (err) {
			return '~';
		}
	});
}

Entry.assets = assetKeys.map(k => window.assets[k]);

module.exports = Entry;