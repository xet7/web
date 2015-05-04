module.exports = /*@ngInject*/function(utils) {
	var a = document.createElement('a');
	document.body.appendChild(a);
	a.style = 'display: none';

	this.saveAs = (data, name) => {
		var blob = new Blob([utils.str2Uint8Array(data)], {type: 'octet/stream'}),
			url = window.URL.createObjectURL(blob);

		a.href = url;
		a.download = name;
		a.click();
		window.URL.revokeObjectURL(url);
	};
};