module.exports = /*@ngInject*/function($timeout) {
	return {
		link: function ( scope, element, attrs ) {
			scope.$watch( attrs.focus, function ( val ) {
				if ( angular.isDefined( val ) && val ) {
					$timeout( function () { element[0].focus(); } );
				}
			}, true);

			element.bind('blur', function () {
				if ( angular.isDefined( attrs.focusLost ) ) {
					scope.$apply( attrs.focusLost );

				}
			});
		}
	};
};