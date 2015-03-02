module.exports = /*@ngInject*/($timeout, $state) => {
	return {
		restrict : 'A',
		link: function (scope, elem) {
			window.addEventListener('dragover', e => e.preventDefault(), false);
			window.addEventListener('drop', e => e.preventDefault(), false);
		}
	};
};