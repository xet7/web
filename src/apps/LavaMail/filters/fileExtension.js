module.exports = () => {
	return (filename) => {
		let i = filename.lastIndexOf('.');
		return filename && i >= 0 ? ('.' + filename.substr(i, filename.length - i)) : '';
	};
};