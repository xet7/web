const sleep = require('co-sleep');

module.exports = /*@ngInject*/function(co) {
	this.hexify = (binaryString) => openpgp.util.hexstrdump(binaryString);

	this.uniq = (array, key = null) => {
		if (!key)
			key = c => c;

		return [...array.reduce((map, c) => {
			map.set(key(c), c);
			return map;
		}, new Map()).values()];
	};

	this.sleep = (time) => co(function *(){
		yield sleep(time);
	});
};