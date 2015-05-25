const fs = require('fs');

module.exports = ($delegate, loader) => {
	function sanitizer (html) {
		function urlX(url) {
			return url;
		}

		function idX(id) {
			return id;
		}

		return window.html_sanitize(html, urlX, idX);
	}

	sanitizer.enableCss = () => {
		return loader.loadJS('/js/vendor/LavaUtils/html-css-sanitizer.js');
	};

	return sanitizer;
};