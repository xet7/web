const fs = require('fs');
const source = require('vinyl-source-stream');
const merge = require('merge-stream');

function Utils() {
	const self = this;

	this.angularApplicationTemplate = fs.readFileSync('./gulp/angularApplicationTemplate.js', 'utf-8');

	this.createFile = function (name, content) {
		var stream = source(name);
		stream.write(content);
		process.nextTick(() => stream.end());

		return stream;
	};

	this.createFiles = function (list) {
		return merge(list.map(e => self.createFile(e.name, e.content)));
	};

	this.logGulpError = function (prefix, path, err) {
		plg.util.log(
			plg.util.colors.red(prefix),
			err.message,
			'\n\t',
			plg.util.colors.cyan('in file'),
			path
		);
	};

	this.def = (func, def) => {
		try {
			return func();
		} catch (err) {
			return def;
		}
	};
}

module.exports = new Utils();
