angular.module(primaryApplicationName).directive('fileSelect',
	($parse) => {
		return {
			link: (scope, element, attrs) => {
				var getFile = $parse(attrs.getFile);
				element.bind('change', (e) => {
					getFile(scope, {file: (e.srcElement || e.target).files[0]});
				});
			}
		};
	});
