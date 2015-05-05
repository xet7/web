module.exports = /*@ngInject*/function(utils) {
	this.saveAs = (data, name) => {
		var blob = new Blob([utils.str2Uint8Array(data)], {type: 'octet/stream'});

		saveAs(blob, name);
	};
};