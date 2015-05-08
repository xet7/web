module.exports = /*@ngInject*/($translate, $timeout, $state, $compile, $sanitize, $templateCache, co, user, consts, utils, crypto) => {
	const emailRegex = /([-A-Z0-9_.]*[A-Z0-9]@[-A-Z0-9_.]*[A-Z0-9])/ig;
	const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	const pgpRegex = /(-----BEGIN PGP MESSAGE-----[^-]+-----END PGP MESSAGE-----)/ig;

	const translations = {
		TITLE_OPENPGP_BLOCK_DECRYPT_ERROR_NO_KEY_FOUND: '',
		TITLE_OPENPGP_BLOCK_DECRYPT_ERROR: ''
	};

	$translate.bindAsObject(translations, 'INBOX');

	const getDOM = (html) => {
		var dom = new DOMParser().parseFromString(html, 'text/html');
		return dom.querySelector('body');
	};

	const transformCustomTextNodes = (dom, transforms, level = 0) => {
		for(let node of dom.childNodes) {
			if (node.nodeName == '#text') {
				const data = node.data.trim();
				const parent = node.parentNode;

				if (!data || !parent)
					continue;

				let newData = node.data;
				for (let t of transforms)
					newData = newData.replace(t.regex, t.replace);

				if (newData && newData != node.data) {
					const newDataDOM = getDOM(newData);
					let newDataNodes = [];
					for (let i = 0; i < newDataDOM.childNodes.length; i++)
						newDataNodes.push(newDataDOM.childNodes[i]);

					for (let i = 0; i < newDataNodes.length; i++)
						parent.insertBefore(newDataNodes[i], node);
					parent.removeChild(node);
				}
			}
			else if (node.nodeName != 'A' && node.childNodes)
				transformCustomTextNodes(node, transforms, level + 1);
		}

		if (level === 0)
			return dom;
	};

	const transformTextNodes = (dom, level = 0) => co(function *(){
		if (level >= 3)
			return;

		let pgpMessages = {};

		const pgpRemember = (str, pgpMessage) => {
			pgpMessages[pgpMessage] = co(function *(){
				try {
					let message = yield crypto.decodeRaw(pgpMessage);

					let wrappedMessage = `<div>${message}</div>`;
					let sanitizedMessage = $sanitize(wrappedMessage);

					let dom = getDOM(sanitizedMessage);

					yield transformTextNodes(dom, level + 1);

					return dom.innerHTML;
				} catch (error) {
					if (error.message == 'no_private_key')
						return `<pre title='${translations.TITLE_OPENPGP_BLOCK_DECRYPT_ERROR_NO_KEY_FOUND}'>${pgpMessage}</pre>`;
					return `<pre title='${translations.TITLE_OPENPGP_BLOCK_DECRYPT_ERROR}'>${pgpMessage}</pre>`;
				}
			});
			return '';
		};

		const pgpReplace = (str, pgpMessage) => {
			if (pgpMessages[pgpMessage])
				return pgpMessages[pgpMessage];
			return pgpMessage;
		};

		transformCustomTextNodes(dom, [
			{regex: pgpRegex, replace: pgpRemember}
		]);

		pgpMessages = yield pgpMessages;

		transformCustomTextNodes(dom, [
			{regex: pgpRegex, replace: pgpReplace}
		]);

		transformCustomTextNodes(dom, [
			{regex: emailRegex, replace: '<a href="mailto:$1">$1</a>'},
			{regex: urlRegex, replace: '<a href="$1">$1</a>'}
		]);
	});

	let linksCounter = 0;
	const transformEmail = (dom, {imagesSetting, noImageTemplate, emails}, level = 0) => {
		const getEmailContextMenuDOM = (i) =>
			getDOM(`<email-context-menu email="emails[${i}].email" is-open="emails[${i}].isDropdownOpened"></email-context-menu>`);
		const noImageTemplateDOM = getDOM(noImageTemplate);

		if (level === 0) {
			linksCounter = 0;
		}

		const processNode = (node) => {
			if (node.nodeName == 'IMG') {
				let src = node.getAttribute('src');

				if (!src)
					return;
				src = src.trim();
				if (!src || src.startsWith('data:'))
					return;

				if (imagesSetting == 'none') {
					node.parentNode.replaceChild(noImageTemplateDOM, node);
				} else if (imagesSetting == 'proxy') {
					const proxifiedImageUri = `${consts.IMAGES_PROXY_URI}/i/${src.replace(/http[s]*:\/\//i, '')}`;
					node.setAttribute('src', proxifiedImageUri);

					const parent = node.parentNode;
					if (parent.nodeName != 'A')
						return;

					let href = parent.getAttribute('href');
					if (!href)
						return;

					href = href.trim();
					if (href == src)
						parent.setAttribute('href', proxifiedImageUri);
				} else if (imagesSetting == 'directHttps') {
					if (!src.startsWith('https://'))
						node.parentNode.replaceChild(noImageTemplateDOM, node);
				}
			} else
			if (node.nodeName == 'A') {
				let href = node.getAttribute('href');

				if (!href)
					return;
				href = href.trim();
				if (!href)
					return;

				if (href.startsWith('mailto:')) {
					const toEmail = href.replace('mailto:', '').trim();
					emails.push({
						email: toEmail,
						isDropdownOpened: false
					});

					node.setAttribute('href', $state.href('.popup.compose', {to: toEmail}));
					node.setAttribute('ng-right-click', `switchContextMenu(${linksCounter})`);

					const emailContextMenuDOM = getEmailContextMenuDOM(linksCounter);
					node.parentNode.replaceChild(emailContextMenuDOM, node);
					emailContextMenuDOM.appendChild(node);

					linksCounter++;
				} else
					node.setAttribute('target', '_blank');
			}
		};

		for(let node of dom.childNodes) {
			processNode(node);

			if (node.childNodes)
				transformEmail(node, {imagesSetting, noImageTemplate, emails}, level + 1);
		}
	};

	const process = (scope, el, attrs) => co(function *(){
		const loadingTemplateUrl = yield $templateCache.fetch(scope.loadingTemplateUrl);

		scope.originalEmail = scope.emailBody;
		el.empty();
		el.append(loadingTemplateUrl);

		scope.emails = [];
		scope.switchContextMenu = index => scope.emails[index].isDropdownOpened = !scope.emails[index].isDropdownOpened;

		const noImageTemplate = yield $templateCache.fetch(scope.noImageTemplateUrl);
		const snapTemplate = yield $templateCache.fetch(scope.snapTemplateUrl);

		let emailBody = null;
		try {
			let wrappedEmailBody = `<div>${scope.emailBody}</div>`;
			let sanitizedEmailBody = $sanitize(wrappedEmailBody);

			let dom = getDOM(sanitizedEmailBody);

			yield transformTextNodes(dom);

			transformEmail(dom, {
				imagesSetting: user.settings.images,
				noImageTemplate: noImageTemplate,
				emails: scope.emails
			});

			let emailBodyHtml = dom.innerHTML;

			let emailBodyEl = angular.element(emailBodyHtml);
			emailBody = $compile(emailBodyEl)(scope);
		} catch (err) {
			console.error(`error during email body transforming: "${err.message}"`);

			try {
				let emailBodyEl = angular.element(snapTemplate);
				emailBody = $compile(emailBodyEl)(scope);
			} catch (err) {
				console.error(`error during snap template processing: "${err.message}"`);
				return;
			}
		}

		$timeout(() => {
			scope.emailBody = emailBody.html();
		}, 100);

		console.log('scope.emailBody updated', scope.emailBody);

		el.empty();
		el.append(emailBody);
	});

	return {
		restrict : 'A',
		scope: {
			emailBody: '=',
			originalEmailName: '=',
			noImageTemplateUrl: '@',
			loadingTemplateUrl: '@',
			snapTemplateUrl: '@',
			openEmail: '=',
			downloadEmail: '='
		},
		link  : (scope, el, attrs) => {
			process(scope, el, attrs);
		}
	};
};