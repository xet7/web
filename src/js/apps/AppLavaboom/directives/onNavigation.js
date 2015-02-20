module.exports = /*@ngInject*/($rootScope, $document) => {
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