module.exports = /*@ngInject*/() =>
	number => {
		if (!number || number < 1)
			return '';

		if (number < 999)
			return number;

		return '999+';
	};