var Buffer = require('buffer/').Buffer;

module.exports = function() {
	this.hexify = (binaryString) => (new Buffer(binaryString, 'binary')).toString('hex');
};