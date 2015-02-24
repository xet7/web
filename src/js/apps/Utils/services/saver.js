module.exports = /*@ngInject*/function() {
	this.saveAs = (data, name) => {
		let hiddenElement = document.createElement('a');

		hiddenElement.href = 'data:attachment/text,' + encodeURI(data);
		hiddenElement.target = '_blank';
		hiddenElement.download = name;
		hiddenElement.click();
	};
};