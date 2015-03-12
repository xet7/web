module.exports = /*@ngInject*/($timeout, $state, $compile, $sanitize, user) => {
	const emailRegex = /(\S+@[-A-Z0-9_.]*[A-Z0-9])/ig;
	const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

	const transformEmailBody = (emailBody) => {
		return emailBody
			.replace(emailRegex, '<a href="mailto:$1">$1</a>')
			.replace(urlRegex, '<a href="$1">$1</a>');
	};

	return {
		restrict : 'A',
		scope: {
			emailBody: '='
		},
		link  : (scope, el, attrs) => {
			$timeout(() => {
				scope.status = {
					isDropdownOpened: []
				};

				scope.switchContextMenu = index => scope.status.isDropdownOpened[index] = !scope.status.isDropdownOpened[index];

				const emailBody = transformEmailBody(scope.emailBody);
				console.log('email body is: ', scope.emailBody, emailBody);

				const emailBodyHtml = angular.element('<div>' + $sanitize(emailBody) + '</div>');

				let i = 0;
				angular.forEach(emailBodyHtml.find('a'), e => {
					e = angular.element(e);
					if (e.attr('href').startsWith('mailto:')) {
						e.attr('href', $state.href('.popup.compose', {to: e.attr('href').replace('mailto:', '').trim()}));
						e.attr('ng-right-click', `switchContextMenu(${i})`);
						e.wrap(`<email-context-menu is-open="status.isDropdownOpened[${i}]"></email-context-menu>`);
						i++;
					} else
						e.attr('target', '_blank');
				});

				if (user.settings.isSecuredImages)
					angular.forEach(emailBodyHtml.find('img'), e => {
						e = angular.element(e);
						if (!e.attr('src').startsWith('data:'))
							e.attr('src', '/img/no-image.png');
					});

				const emailBodyCompiled = $compile(emailBodyHtml)(scope);

				el.append(emailBodyCompiled);
			});
		}
	};
};