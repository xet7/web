module.exports = /*@ngInject*/($compile, fileReader) => ({
	restrict : 'A',
	scope: {
		openRawFile: '&',
		openRawError: '&'
	},
	link  : (scope, el, attrs) => {
		scope.getFile = (file) => {
			scope.openRawFile({file});
		};

		const buttonEl = angular.element('<input class="hidden" type="file" file-select get-file="getFile(file)"/>');
		$compile(buttonEl)(scope);

		el.bind('click', () => buttonEl[0].click());
	}
});