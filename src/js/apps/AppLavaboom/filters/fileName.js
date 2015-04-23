module.exports = /*@ngInject*/($rootScope, $translate, $filter) => {
	return (filename) => {
		return filename.replace(/\.[^/.]+$/, '');
	};
};