module.exports = /*@ngInject*/($compile, fileReader) => {
	return {
		restrict : 'A',
		scope: {
			openFile: '&',
			openError: '&'
		},
		link  : function(scope, el, attrs) {
			var buttonEl = angular.element('<input class="hidden" type="file" file-select get-file="getFile(file)"/>');
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
	};
};