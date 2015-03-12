module.exports = /*@ngInject*/($templateCache, $compile) => {
	return {
		restrict : 'E',
		scope: {
			isOpen: '=',
			email: '='
		},
		link  : (scope, el, attrs) => {
			$templateCache.fetch('partials/directives/emailContextMenu.html')
				.then(template => {
					const compiledTemplate = $compile(template)(scope);
					el.prepend(compiledTemplate);
				});
		}
	};
};