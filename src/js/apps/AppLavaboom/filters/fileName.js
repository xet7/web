module.exports = /*@ngInject*/() => {
	return (filename) => {
		let i = filename.lastIndexOf('.');
		return i >= 0 ? filename.substr(0, i) : filename;
	};
};