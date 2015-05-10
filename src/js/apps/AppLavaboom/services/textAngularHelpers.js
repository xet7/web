module.exports = /*@ngInject*/function (utils, taSelection) {
	const self = this;

	this.ctrlEnterCallback = null;

	const getText = (dom, level = 0) => {
		let curText = '';

		for(let node of dom.childNodes) {
			if (node.nodeName == '#text')
				curText += node.data;
			if (node.nodeName == 'BR')
				curText += '\n';

			if (node.childNodes)
				curText += getText(node, level + 1);
		}

		return curText;
	};

	this.formatPaste = (html) => {
		let dom = utils.getDOM(html);

		let selection = taSelection.getSelection();

		let text = '';
		if (selection.start.element.nodeName == 'PRE' && selection.end.element.nodeName == 'PRE')
			text = getText(dom);
		else
			text = html;

		console.log('text-angular paste original: ', html, 'formatted to', text);

		return text;
	};
};