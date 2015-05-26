module.exports = function (utils, taSelection) {
	const self = this;
	const newLineRegex = /(\r\n|\r|\n)/g;
	const tagRegex = /<[a-z][\s\S]*>/gi;

	this.ctrlEnterCallback = null;

	function htmlToText (dom, level = 0) {
		let curText = '';

		for(let node of dom.childNodes) {
			if (node.nodeName == '#text')
				curText += node.data;
			if (node.nodeName == 'BR')
				curText += '\n';

			if (node.childNodes)
				curText += htmlToText(node, level + 1);
		}

		return level === 0 ? `<pre>${curText}</pre>` : curText;
	}

	function textToHtml (text) {
		const replace = text => {
			let r = text
				.replace(newLineRegex, '<br />');

			return r;
		};

		let i = 0;
		let dom = utils.getDOM(`<div>${text}</div>`);
		let parent = dom.childNodes[0];

		for (let node of parent.childNodes) {
			if (node.nodeName == '#text') {
				let newDom = utils.getDOM(replace(node.data));
				parent.insertBefore(newDom, node);
				parent.removeChild(node);
			}
		}

		return dom.innerHTML;
	}

	this.formatPaste = (paste) => {
		let selection = taSelection.getSelection();

		let formatted = '';
		if (selection.start.element.nodeName == 'PRE' && selection.end.element.nodeName == 'PRE') {
			let dom = utils.getDOM(paste);
			formatted = htmlToText(dom);
		} else {
			if (!tagRegex.test(paste))
				formatted = textToHtml(paste);
		}

		return formatted;
	};
};