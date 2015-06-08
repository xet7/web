module.exports = function ($rootScope, $templateCache, $compile, co, utils) {
	const transformNodes = (dom, level = 0) => {
		for(let node of dom.childNodes) {
			if (node.getAttribute) {
				let classAttr = node.getAttribute('class');
				if (classAttr && classAttr.length > 1) {
					let classes = classAttr.match(/\S+/g).filter(c => !c.startsWith('ng-'));
					node.setAttribute('class', classes.join(' '));
				}
			}

			if (node.childNodes && node.childNodes.length > 0)
				transformNodes(node, level + 1);
		}
	};

	this.cleanupOutboundEmail = (body) => {
		let dom = utils.getDOM(body);
		transformNodes(dom);

		console.log('cleanupOutboundEmail: ', body, 'transformed to: ', dom.innerHTML);

		return dom.innerHTML;
	};

	this.buildForwardedTemplate = (body, signature, forwardEmails) => co(function *(){
		return yield utils.fetchAndCompile('LavaMail/inbox/forwardedEmail', {
			body,
			signature,
			forwardEmails
		});
	});

	this.buildRepliedTemplate = (body, signature, replies) => co(function *(){
		return yield utils.fetchAndCompile('LavaMail/inbox/repliedEmail', {
			body,
			signature,
			replies
		});
	});

	this.buildDirectTemplate = (body, signature) => co(function *(){
		return yield utils.fetchAndCompile('LavaMail/inbox/directEmail', {
			body,
			signature
		});
	});
};