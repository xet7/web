var Buffer = require('buffer/').Buffer;

module.exports = /*@ngInject*/function() {
	this.hexify = (binaryString) => (new Buffer(binaryString, 'binary')).toString('hex');
};