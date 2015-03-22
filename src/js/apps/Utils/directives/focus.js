module.exports = /*@ngInject*/ ($timeout) => ({
	link: ( scope, element, attrs ) => {
		scope.$watch( attrs.focus, val => {
			if ( angular.isDefined( val ) && val ) {
				$timeout( () => { element[0].focus(); } );
			}
		}, true);

		element.bind('blur', () => {
			if ( angular.isDefined( attrs.focusLost ) ) {
				scope.$apply( attrs.focusLost );
			}
		});
	}
});