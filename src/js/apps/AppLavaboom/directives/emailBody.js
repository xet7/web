module.exports = /*@ngInject*/($timeout, $state, $compile, $sanitize, user) => {
	return {
		restrict : 'A',
		scope: {
			emailBody: '='
		},
		link  : (scope, el, attrs) => {
			$timeout(() => {
				const emailBodyHtml = angular.element('<div>' + $sanitize(scope.emailBody) + '</div>');

				angular.forEach(emailBodyHtml.find('a'), e => {
					e = angular.element(e);
					if (e.attr('href').startsWith('mailto:')) {
						e.attr('href', $state.href('.popup.compose', {to: e.attr('href').replace('mailto:', '').trim()}));
					} else
						e.attr('target', '_blank');
				});

				if (user.settings.isSecuredImages)
					angular.forEach(emailBodyHtml.find('img'), e => {
						e = angular.element(e);
						if (!e.attr('src').startsWith('data:'))
							e.attr('src', '/img/no-image.png');
					});

				el.append(emailBodyHtml);
			});
		}
	};
};