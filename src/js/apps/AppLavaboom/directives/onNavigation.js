module.exports = /*@ngInject*/($rootScope, $document, $state, router) => {
	let bind = false;

	return {
		restrict : 'A',
		scope: {
			onNavigation: '&'
		},
		link  : function(scope, el, attrs) {
			if (bind)
				return;
			bind = true;

			$document.bind('keydown', (event) => $rootScope.$apply(() => {
				if (router.isPopupState($state.current.name))
					return;

				var delta = 0;
				if (event.keyIdentifier == 'Up')
					delta = -1;
				else if (event.keyIdentifier == 'Down')
					delta = +1;

				if (delta)
					scope.onNavigation({delta: delta});
			}));
		}
	};
};