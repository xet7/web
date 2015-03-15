module.exports = /*@ngInject*/($timeout, $state, $compile, $sanitize, $templateCache, co, user) => {
	const emailRegex = /[^"'](\s*)(\S+@[-A-Z0-9_.]*[A-Z0-9])/ig;
	const urlRegex = /[^"'](\s*)(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

	const transformEmailBody = (emailBody) => emailBody
		.replace(emailRegex, '$1<a href="mailto:$2">$2</a>')
		.replace(urlRegex, '$1<a href="$2">$2</a>');

	return {
		restrict : 'A',
		scope: {
			emailBody: '=',
			noImageTemplateUrl: '@'
		},
		link  : (scope, el, attrs) => {
			co(function *(){
				const noImageTemplate = yield $templateCache.fetch(scope.noImageTemplateUrl);

				scope.emails = [];

				scope.switchContextMenu = index => scope.emails[index].isDropdownOpened = !scope.emails[index].isDropdownOpened;

				const emailBody = transformEmailBody(scope.emailBody);
				console.log('email body is: ', scope.emailBody, emailBody);

				const emailBodyHtml = angular.element('<div>' + $sanitize(emailBody) + '</div>');

				let i = 0;
				angular.forEach(emailBodyHtml.find('a'), e => {
					e = angular.element(e);
					if (e.attr('href').startsWith('mailto:')) {
						const toEmail = e.attr('href').replace('mailto:', '').trim();
						scope.emails.push({
							email: toEmail,
							isDropdownOpened: false
						});

						e.attr('href', $state.href('.popup.compose', {to: toEmail}));
						e.attr('ng-right-click', `switchContextMenu(${i})`);

						e.wrap(`<email-context-menu email="emails[${i}].email" is-open="emails[${i}].isDropdownOpened"></email-context-menu>`);
						i++;
					} else
						e.attr('target', '_blank');
				});

				if (user.settings.isSecuredImages)
					angular.forEach(emailBodyHtml.find('img'), e => {
						e = angular.element(e);
						if (!e.attr('src').startsWith('data:'))
							e.replaceWith(noImageTemplate);
					});

				const emailBodyCompiled = $compile(emailBodyHtml)(scope);

				el.append(emailBodyCompiled);
			});
		}
	};
};