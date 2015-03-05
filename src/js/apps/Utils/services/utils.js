var Buffer = require('buffer/').Buffer;

module.exports = /*@ngInject*/function() {
	this.hexify = (binaryString) => (new Buffer(binaryString, 'binary')).toString('hex');

	this.uniq = (array, key = null) => {
		if (!key)
			key = c => c;

		return [...array.reduce((map, c) => {
			map.set(key(c), c);
			return map;
		}, new Map()).values()];
	};
};