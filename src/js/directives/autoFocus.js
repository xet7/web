angular.module(primaryApplicationName).directive('autoFocus', $timeout => {
	return {
		scope: {
			trigger: '@autoFocus'
		},
		link: (scope, element) => {
			scope.$watch('trigger', function (value) {
				if (value) {
					$timeout(function () {
						console.log('giving focus to element', element[0].id);
						element[0].focus();
					});
				}
			});
		}
	};
});