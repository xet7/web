var Buffer = require('buffer/').Buffer;

angular.module(primaryApplicationName).service('utils', function() {
	this.hexify = (binaryString) => (new Buffer(binaryString, 'binary')).toString('hex');
});