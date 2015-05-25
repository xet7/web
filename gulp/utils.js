const co = require('co');
const chan = require('chan');

const source = require('vinyl-source-stream');
const merge = require('merge-stream');

const fs = require('fs');
const crypto = require('crypto');
const childProcess = require('child_process');
const spawn = childProcess.spawn;

function Utils() {
	const self = this;

	this.calcHash = function (fileName) {
		return co(function *() {
			let content = yield fs.readFileAsync(fileName, 'utf8');
			let sha = crypto.createHash('sha256');
			sha.update(content, 'utf8');
			return sha.digest().toString('hex');
		});
	};

	this.createEmptyTask = function () {
		return cb => cb();
	};

	this.createFile = function (name, content) {
		var stream = source(name);
		stream.write(content);
		process.nextTick(() => stream.end());

		return stream;
	};

	this.execute = function (cmd, args, opts) {
		return co(function *(){
			let p = spawn(cmd, args, opts);
			let ch = chan();

			p.on('exit', function (code) {
				ch(code);
			});

			return yield ch;
		});
	};

	this.lowerise = function (str) {
		return str[0].toLowerCase() + str.substr(1);
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