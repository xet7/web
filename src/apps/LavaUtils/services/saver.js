module.exports = function($translate, utils, notifications, co) {
	const notifications18n = {
		BAD_BROWSER_TITLE: '',
		BAD_BROWSER_TEXT: ''
	};

	$translate.bindAsObject(notifications18n, 'NOTIFICATIONS');

	function checkBrowser() {
		if (utils.getBrowser().isSafari || !window.Blob || !window.FileReader)
			notifications.set('bad-browser', {
				title: notifications18n.BAD_BROWSER_TITLE,
				text: notifications18n.BAD_BROWSER_TEXT,
				type: 'warning'
			});

		return !!window.Blob && !!window.FileReader;
	}

	this.saveAs = (data, name, type = 'application/octet-stream') => {
		if (!checkBrowser())
			return;

		var blob = new Blob([utils.str2Uint8Array(data)], {type: type});
		saveAs(blob, name);
	};

	this.openAs = (data, type) => {
		if (!checkBrowser())
			return;

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