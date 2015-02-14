module.exports = /*@ngInject*/() => {
	return (v, defaultValue) => v ? v : defaultValue;
};