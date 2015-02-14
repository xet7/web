module.exports = ($timeout, $state) => {
	return {
		restrict : 'A',
		link  : function(scope, el, attrs) {
			console.log('email-body.link');
			$timeout(() => {
				angular.forEach(el.find('a'), function (e) {
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