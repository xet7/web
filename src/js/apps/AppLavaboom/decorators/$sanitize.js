module.exports = /*@ngInject*/($delegate, $injector) => {
	function sanitizer (html) {
		const user = $injector.get('user');

		if (user.settings.styles == 'none')
			return window.html_sanitize(html);

		if (user.settings.styles == 'all')
			return window.html_css_sanitize(html);

		return window.html_sanitize(html);
	}

	return sanitizer;
};