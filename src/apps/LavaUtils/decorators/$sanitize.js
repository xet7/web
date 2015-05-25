const fs = require('fs');

module.exports = ($delegate, loader, utils) => {
	let rexExp = /["'](data:image\/[^"']+)["']/ig;

	function sanitizer (html) {
		let dataUris = {};

		function urlX(url) {
			if (dataUris[url])
				return dataUris[url];
			return url;
		}

		function idX(id) {
			return id;
		}

		html = html.replace(rexExp, function(match, url) {
			let key = `http://${utils.getRandomString()}/`;
			dataUris[key] = url;
			return key;
		});

		return window.html_sanitize(html, urlX, idX);
	}

	sanitizer.enableCss = () => {
		return loader.loadJS('/js/vendor/LavaUtils/html-css-sanitizer.js');
	};

	return sanitizer;
};
