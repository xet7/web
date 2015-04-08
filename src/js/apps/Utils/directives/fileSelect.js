module.exports = /*@ngInject*/($parse) => ({
	link: (scope, element, attrs) => {
		const getFile = $parse(attrs.getFile);
		element.bind('change', (e) => {
			getFile(scope, {file: (e.srcElement || e.target).files[0]});
		});
	}
});
