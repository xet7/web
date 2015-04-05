let fs = require('fs');

module.exports = /*@ngInject*/($timeout, $state, $compile, $sanitize, $templateCache, co, user, consts) => {
	const emailRegex = /([-A-Z0-9_.]*[A-Z0-9]@[-A-Z0-9_.]*[A-Z0-9])/ig;
	const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

	const getDOM = (html) => {
		var dom = new DOMParser().parseFromString(html, 'text/html');
		return dom.querySelector('body');
	};

	const transformDOM = (dom, transforms, level = 0) => {
		for(let node of dom.childNodes) {
			if (node.nodeName == '#text') {
				const data = node.data.trim();
				const parent = node.parentNode;

				if (!data || !parent)
					continue;

				let newData = node.data;
				for (let t of transforms)
					newData = newData.replace(t.regex, t.replace);

				if (newData != node.data) {
					const newDataDOM = getDOM(newData);
					let newDataNodes = [];
					for (let i = 0; i < newDataDOM.childNodes.length; i++)
						newDataNodes.push(newDataDOM.childNodes[i]);

					parent.removeChild(node);
					for (let i = 0; i < newDataNodes.length; i++)
						parent.appendChild(newDataNodes[i]);
				}
			}
			else if (node.nodeName.toLowerCase() != 'a' && node.childNodes)
				transformDOM(node, transforms, level + 1);
		}

		if (level === 0)
			return dom.innerHTML;
	};

	const transformEmailDOM = (dom) =>
		transformDOM(dom, [
			{regex:emailRegex, replace: '<a href="mailto:$1">$1</a>'},
			{regex: urlRegex, replace: '<a href="$1">$1</a>'}
		]);

	const transformLinks = (emailBodyHtml, emails) => {
		let i = 0;
		angular.forEach(emailBodyHtml.find('a'), e => {
			e = angular.element(e);
			let href = e.attr('href');

			if (href) {
				href = href.trim();

				if (href.startsWith('mailto:')) {
					const toEmail = href.replace('mailto:', '').trim();
					emails.push({
						email: toEmail,
						isDropdownOpened: false
					});

					e.attr('href', $state.href('.popup.compose', {to: toEmail}));
					e.attr('ng-right-click', `switchContextMenu(${i})`);

					e.wrap(`<email-context-menu email="emails[${i}].email" is-open="emails[${i}].isDropdownOpened"></email-context-menu>`);
					i++;
				} else
					e.attr('target', '_blank');
			}
		});
	};

	const transformImages = (emailBodyHtml, imagesSetting, noImageTemplate) => {
		angular.forEach(emailBodyHtml.find('img'), e => {
			e = angular.element(e);
			let src = e.attr('src');

			if (src) {
				src = src.trim();
				if (!src.startsWith('data:')) {
					if (imagesSetting == 'none') {
						e.replaceWith(noImageTemplate);
					} else if (imagesSetting == 'proxy') {
						e.attr('src', `${consts.IMAGES_PROXY_URI}/${src}`);
					} else if (imagesSetting == 'directHttps') {
						if (!src.startsWith('https://'))
							e.replaceWith(noImageTemplate);
					}
				}
			}
		});
	};

	return {
		restrict : 'A',
		scope: {
			emailBody: '=',
			noImageTemplateUrl: '@'
		},
		link  : (scope, el, attrs) => {
			co(function *(){
				scope.emails = [];
				scope.switchContextMenu = index => scope.emails[index].isDropdownOpened = !scope.emails[index].isDropdownOpened;

				const noImageTemplate = yield $templateCache.fetch(scope.noImageTemplateUrl);

				console.log('email body', `"${scope.emailBody}"`);

				let transformedEmailBody = '';
				let sanitizedTransformedEmailBody = '';
				let emailBodyHtml = '';
				try {
					const dom = getDOM(scope.emailBody);
					transformedEmailBody = transformEmailDOM(dom);

					sanitizedTransformedEmailBody = $sanitize(transformedEmailBody);
					emailBodyHtml = angular.element(`<div>${sanitizedTransformedEmailBody}</div>`);

					transformLinks(emailBodyHtml, scope.emails);
					transformImages(emailBodyHtml, user.settings.images, noImageTemplate);

				} catch (err) {
					console.error(
						`error during email body processing: "${err.message}", raw email body: `,
						`"${scope.emailBody}"`,
						', transformed email body: ',
						`"${transformedEmailBody}"`,
						', sanitized transformed email body: ',
						`"${sanitizedTransformedEmailBody}"`
					);
					throw err;
				}

				const emailBodyCompiled = $compile(emailBodyHtml)(scope);
				el.append(emailBodyCompiled);
			});
		}
	};
};