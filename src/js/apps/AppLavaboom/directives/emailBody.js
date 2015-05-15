module.exports = /*@ngInject*/($translate, $timeout, $state, $compile, $sanitize, $templateCache,
							   co, user, consts, utils, crypto, notifications) => {
	const emailRegex = /([-A-Z0-9_.]*[A-Z0-9]@[-A-Z0-9_.]*[A-Z0-9])/ig;
	const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	const pgpRegex = /(-----BEGIN PGP MESSAGE-----[^-]+-----END PGP MESSAGE-----)/ig;

	const translations = {
		TITLE_OPENPGP_BLOCK_DECRYPT_ERROR_NO_KEY_FOUND: '',
		TITLE_OPENPGP_BLOCK_DECRYPT_ERROR: ''
	};

	$translate.bindAsObject(translations, 'INBOX');

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
					const newDataDOM = utils.getDOM(newData);
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
			console.log('remember hidden message', pgpMessage);
			pgpMessages[pgpMessage] = co(function *(){
				try {
					let message = yield crypto.decodeRaw(pgpMessage);

					let wrappedMessage = `<div>${message}</div>`;
					let sanitizedMessage = $sanitize(wrappedMessage);

					let dom = utils.getDOM(sanitizedMessage);

					yield transformTextNodes(dom, level + 1);

					console.log('decrypted hidden message', dom.innerHTML);

					return dom.innerHTML;
				} catch (error) {
					if (error.message == 'no_private_key') {
						notifications.set('openpgp-envelope-decode-failed', {
							text: translations.TITLE_OPENPGP_BLOCK_DECRYPT_ERROR_NO_KEY_FOUND,
							type: 'warning',
							namespace: 'mailbox'
						});
						return `<pre title='${translations.TITLE_OPENPGP_BLOCK_DECRYPT_ERROR_NO_KEY_FOUND}'>${pgpMessage}</pre>`;
					}

					notifications.set('openpgp-envelope-decode-failed', {
						text: translations.TITLE_OPENPGP_BLOCK_DECRYPT_ERROR,
						type: 'warning',
						namespace: 'mailbox'
					});
					return `<pre title='${translations.TITLE_OPENPGP_BLOCK_DECRYPT_ERROR}'>${pgpMessage}</pre>`;
				}
			});
			return pgpMessage;
		};

		const pgpReplace = (str, pgpMessage) => {
			if (pgpMessages[pgpMessage]) {
				console.log('replace hidden message!');
				return pgpMessages[pgpMessage];
			} else console.log('cannot replace hidden message!');
			return pgpMessage;
		};

		transformCustomTextNodes(dom, [
			{regex: pgpRegex, replace: pgpRemember}
		]);

		pgpMessages = yield pgpMessages;

		console.log('replacing possible hidden messages...', dom.innerHTML);

		transformCustomTextNodes(dom, [
			{regex: pgpRegex, replace: pgpReplace}
		]);

		console.log('replaced possible hidden messages...', dom.innerHTML);

		transformCustomTextNodes(dom, [
			{regex: emailRegex, replace: '<a href="mailto:$1">$1</a>'},
			{regex: urlRegex, replace: '<a href="$1">$1</a>'}
		]);
	});

	let linksCounter = 0;
	const transformEmail = (dom, {imagesSetting, noImageTemplate, emails}, level = 0) => {
		const getEmailContextMenuDOM = (i) =>
			utils.getDOM(`<email-context-menu email="emails[${i}].email" is-open="emails[${i}].isDropdownOpened"></email-context-menu>`);
		const noImageTemplateDOM = utils.getDOM(noImageTemplate);

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
			let wrapperTag = scope.isHtml ? 'div' : 'pre';
			let wrappedEmailBody = `<${wrapperTag}>${scope.emailBody}</${wrapperTag}>`;
			let sanitizedEmailBody = $sanitize(wrappedEmailBody);

			let dom = utils.getDOM(sanitizedEmailBody);

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

		el.empty();
		el.append(emailBody);
	});

	return {
		restrict : 'A',
		scope: {
			isHtml: '=',
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