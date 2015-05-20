module.exports = /*@ngInject*/($injector) => {
	function sanitizer (html) {
		const user = $injector.get('user');

		function urlX(url) {
			return url;
		}
		
		function idX(id) {
			return id;
		}

		if (user.settings.styles == 'none')
			return window.no_css_html_sanitize(html, urlX, idX);

		if (user.settings.styles == 'all')
			return window.css_html_sanitize(html, urlX, idX);

		return window.no_css_html_sanitize(html, urlX, idX);
	}

	return sanitizer;
};