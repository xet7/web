module.exports = /*@ngInject*/($rootScope, $translate, $filter) => {
	return (filename) => {
		 return '.' + filename.substr((~-filename.lastIndexOf('.') >>> 0) + 2);
	};
};