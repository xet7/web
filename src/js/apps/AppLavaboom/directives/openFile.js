module.exports = /*@ngInject*/($compile, fileReader) => ({
	restrict : 'A',
	scope: {
		openFile: '&',
		openError: '&'
	},
	link  : (scope, el, attrs) => {
		const buttonEl = angular.element('<input class="hidden" type="file" file-select get-file="getFile(file)"/>');
		$compile(buttonEl)(scope);

		el.bind('click', () => buttonEl[0].click());

		scope.getFile = (file) => {
			fileReader.readAsText(file)
				.then(data => {
					scope.openFile({data: data});
				})
				.catch(error => {
					if (scope.openError)
						scope.openError(error);
				});
		};
	}
});