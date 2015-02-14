module.exports = /*@ngInject*/() => {
	return {
		require: 'ngModel',
		link: function(scope, elem, attrs, ngModel) {
			var r = attrs.maxRepeating;
			ngModel.$parsers.unshift(value => {
				var isValid = true;
				value.split('').reduce((a, c) => {
					if (a && c == a.pc) {
						a.count++;
						if (a.count > r)
							isValid = false;
					}
					else a = {pc: c, count: 0};

					return a;
				}, null);
				ngModel.$setValidity('maxRepeating', isValid);
				return value;
			});
		}
	};
};