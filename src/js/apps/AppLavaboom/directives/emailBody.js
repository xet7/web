module.exports = /*@ngInject*/($timeout, $state) => {
	return {
		restrict : 'A',
		link  : (scope, el, attrs) => {
			$timeout(() => {
				angular.forEach(el.find('a'), e => {
					e = angular.element(e);
					if (e.attr('href').indexOf('mailto:') === 0) {
						e.attr('href', $state.href('.popup.compose', {to: e.attr('href').replace('mailto:', '').trim()}));
					} else
						e.attr('target', '_blank');
				});
			});
		}
	};
};