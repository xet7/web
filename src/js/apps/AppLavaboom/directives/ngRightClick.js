module.exports = /*@ngInject*/($parse) =>
	(scope, element, attrs) => {
		const fn = $parse(attrs.ngRightClick);
		element.bind('contextmenu', event => {
			scope.$apply(() => {
				event.preventDefault();
				fn(scope, {$event: event});
			});
		});
	};