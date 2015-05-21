var through = require('through');
var jade = require('jade');

module.exports = function (fileName, options) {
	const r1 = /module\.exports\s*=\s*\(/, r2 = /module\.exports\s*=\s*function\s*\(/i;

	if (!fileName.endsWith('.js') || !options.mustInclude.some(e => fileName.includes(e))) {
		return through();
	}
	console.log('filename', fileName);

	var inputString = '';
	return through(
		function (chunk) {
			inputString += chunk;
		},
		function () {
			var self = this;

			let r = inputString
				.replace(r1, 'module.exports = /*@ngInject*/ (')
				.replace(r2, 'module.exports = /*@ngInject*/ function(');

			self.queue(r);
			self.queue(null);
		}
	);
};