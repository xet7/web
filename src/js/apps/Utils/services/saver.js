module.exports = /*@ngInject*/function(utils) {
	this.saveAs = (data, name, type='octet/stream') => {
		var blob = new Blob([utils.str2Uint8Array(data)], {type: type});

		saveAs(blob, name);
	};

	this.openAs = (data, type) => {
		var reader = new FileReader();
		var out = new Blob([data], {type: type});
		reader.onload = function(e){
			var base64Data = btoa(reader.result);
			var dataUri = 'data:' + type + ';base64,' + base64Data;
			window.open(dataUri);
		};
		reader.readAsBinaryString(out);
	};
};