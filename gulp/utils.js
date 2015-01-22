var Utils = function() {
	this.logGulpError = function (prefix, path, err) {
		plg.util.log(
			plg.util.colors.red(prefix),
			err.message,
			'\n\t',
			plg.util.colors.cyan('in file'),
			path
		);
	};
};

module.exports = new Utils();
