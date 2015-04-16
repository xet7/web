module.exports = /*@ngInject*/($delegate, $injector) => {
	const self = $delegate;

	const getDOM = (html) => {
		var dom = new DOMParser().parseFromString(html, 'text/html');
		return dom.querySelector('body');
	};

	const allowedStyle = { };

	const backupStyles = (dom, opts, level = 0) => {
		const processNode = (node) => {
			let style = node.getAttribute('style');
			if (!style)
				return;

			if (style)
				style = style.trim();
			if (!style)
				return;

			const key = 'i' + opts.styleIndex;
			opts.styles[key] = {
				style,
				title: node.getAttribute('title')
			};
			node.setAttribute('title', `${opts.uniqKey}:${opts.styleIndex}`);
			opts.styleIndex++;
		};

		for(let node of dom.childNodes) {
			if (node.getAttribute)
				processNode(node);

			if (node.childNodes)
				backupStyles(node, opts, level + 1);
		}
	};

	const restoreStyles = (dom, opts, level = 0) => {
		const processNode = (node) => {
			const text = node.getAttribute('title');
			const parts = text ? text.split(':') : null;
			const styleIndex = parts && parts[0] == opts.uniqKey ? parts[1] : null;

			if (styleIndex !== null) {
				const key = 'i' + styleIndex;
				node.setAttribute('style', opts.styles[key].style);
				node.setAttribute('title', opts.styles[key].title);
			}
		};

		for(let node of dom.childNodes) {
			if (node.getAttribute)
				processNode(node);

			if (node.childNodes)
				restoreStyles(node, opts, level + 1);
		}

		if (level === 0) {
			for(let node of opts.removeNodes)
				node.parentNode.removeChild(node);
		}
	};

	const getHash = (data) => openpgp.util.hexstrdump(openpgp.crypto.hash.sha256(data));

	function sanitize(html, isAllowed, result) {
		let dom = getDOM(html);

		const stylesOpts = {
			uniqKey: openpgp.util.hexstrdump(openpgp.crypto.random.getRandomBytes(16)),
			styleIndex: 0,
			styles: {},
			removeNodes: []
		};

		backupStyles(dom, stylesOpts);

		const sanitizedEmailBody = $delegate(dom.innerHTML);
		dom = getDOM(sanitizedEmailBody);

		if (isAllowed)
			restoreStyles(dom, stylesOpts);

		if (result)
			result.hasStyles = stylesOpts.styleIndex > 0;

		return dom.innerHTML;
	}

	function sanitizer (html, result) {
		const user = $injector.get('user');

		if (user.settings.styles == 'none')
			return $delegate(html);

		if (user.settings.styles == 'all') {
			return sanitize(html, true, result);
		}

		return $delegate(html);
	}

	sanitizer.isAllowedStyles = (html) => {
		if (!html)
			return false;
		html = html.trim();
		if (!html)
			return false;

		return html in allowedStyle;
	};

	sanitizer.allowStyles = (html) => {
		if (!html)
			return;
		html = html.trim();
		if (!html)
			return;

		allowedStyle[html] = true;
	};

	return sanitizer;
};