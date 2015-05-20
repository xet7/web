module.exports = /*@ngInject*/() => ({
	require: 'ngModel',
	scope: {
		otherModelValue: '=match'
	},
	link: (scope, element, attributes, ngModel) => {
		ngModel.$validators.match = modelValue => modelValue == scope.otherModelValue;
		scope.$watch('otherModelValue', () => ngModel.$validate());
	}
});