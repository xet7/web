module.exports = /*@ngInject*/($delegate) => {
	const self = $delegate;

	const getDOM = (html) => {
		var dom = new DOMParser().parseFromString(html, 'text/html');
		return dom.querySelector('body');
	};

	let uniqKey = null;
	let styleIndex = 0;
	let styles = {};
	let removeNodes = [];

	const backupStyles = (dom, level = 0) => {
		if (level === 0) {
			uniqKey = openpgp.util.hexstrdump(openpgp.crypto.random.getRandomBytes(16));
			styleIndex = 0;
			styles = {};
			removeNodes = [];
		}

		const processNode = (node) => {
			let style = node.getAttribute('style');
			if (!style)
				return;

			if (style)
				style = style.trim();
			if (!style)
				return;

			const key = 'i' + styleIndex;
			styles[key] = {
				style,
				title: node.getAttribute('title')
			};
			node.setAttribute('title', `${uniqKey}:${styleIndex}`);
			styleIndex++;
		};

		for(let node of dom.childNodes) {
			if (node.getAttribute)
				processNode(node);

			if (node.childNodes)
				backupStyles(node, level + 1);
		}
	};

	const restoreStyles = (dom, level = 0) => {
		if (level === 0) {
			removeNodes = [];
		}

		const processNode = (node) => {
			const text = node.getAttribute('title');
			const parts = text ? text.split(':') : null;
			const styleIndex = parts && parts[0] == uniqKey ? parts[1] : null;

			if (styleIndex !== null) {
				const key = 'i' + styleIndex;
				node.setAttribute('style', styles[key].style);
				node.setAttribute('title', styles[key].title);
			}
		};

		for(let node of dom.childNodes) {
			if (node.getAttribute)
				processNode(node);

			if (node.childNodes)
				restoreStyles(node, level + 1);
		}

		if (level === 0) {
			for(let node of removeNodes)
				node.parentNode.removeChild(node);
		}
	};

	return function (html, preserveStyles = true) {
		if (!preserveStyles)
			return $delegate(html);

		let dom = getDOM(html);

		backupStyles(dom);
		const sanitizedEmailBody = $delegate(dom.innerHTML);

		dom = getDOM(sanitizedEmailBody);

		restoreStyles(dom);

		return dom.innerHTML;
	};
};