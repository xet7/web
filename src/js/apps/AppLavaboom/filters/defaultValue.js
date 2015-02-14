angular.module(primaryApplicationName) .filter('defaultValue',
	() => {
		return (v, defaultValue) => v ? v : defaultValue;
	});