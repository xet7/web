module.exports = /*@ngInject*/($parse) => {
	return (scope, element, attrs) => {
		const fn = $parse(attrs.ngRightClick);
		element.bind('contextmenu', event => {
			scope.$apply(() => {
				event.preventDefault();
				fn(scope, {$event: event});
			});
		});
	};
};