module.exports = () => ({
	require: 'ngModel',
	link: (scope, elem, attrs, ngModel) => {
		const r = attrs.maxRepeating;
		ngModel.$parsers.unshift(value => {
			let isValid = true;
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
});