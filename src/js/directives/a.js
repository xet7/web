module.exports = () => {
	return {
		restrict: 'E',
		link: (scope, elem, attrs) => {
			if(attrs.ngClick || attrs.href === '' || attrs.href === '#'){
				elem.on('click', (e) => {
					e.preventDefault();
				});
			}
		}
	};
};