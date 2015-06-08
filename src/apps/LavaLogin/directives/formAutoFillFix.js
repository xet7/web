module.exports = ($interval) => {
	return {
		link: (scope, elem, attrs) => {
			// workaround: fixes Chrome bug https://groups.google.com/forum/#!topic/angular/6NlucSskQjY
			elem.prop('method', 'POST');

			// workaround: fix auto-fill issues where Angular doesn't know about auto-filled inputs
			if(attrs.ngSubmit) {
				setTimeout(() => {
					elem.unbind('submit').bind('submit', function (e) {
						e.preventDefault();
						var arr = elem.find('input');
						if (arr.length > 0) {
							arr.triggerHandler('input');
							arr.triggerHandler('change');
							arr.triggerHandler('keydown');
							scope.$apply(attrs.ngSubmit);
						}
					});
				}, 0);
			}
		}
	};
};