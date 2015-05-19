module.exports = /*@ngInject*/($delegate, $injector) => {
	function sanitizer (html) {
		const user = $injector.get('user');

		function urlX(url) {
			return url;
		}
		
		function idX(id) {
			return id;
		}

		if (user.settings.styles == 'none')
			return window.html_sanitize(html, urlX, idX);

		if (user.settings.styles == 'all')
			return window.html_css_sanitize(html, urlX, idX);

		return window.html_sanitize(html, urlX, idX);
	}

	return sanitizer;
};