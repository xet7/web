module.exports = /*@ngInject*/($timeout, $state) => {
	return {
		restrict : 'A',
		link:  (scope, elem) => {
			window.addEventListener('dragover', e => {
				console.log('drop event', e);
				if (!e.target.id.startsWith('taTextElement')) {
					console.log('drop event preventDefault');
					e.preventDefault();
				}
			}, false);
			window.addEventListener('drop', e => {
				console.log('drop event', e);
				if (!e.target.id.startsWith('taTextElement')) {
					console.log('drop event preventDefault');
					e.preventDefault();
				}
			}, false);
		}
	};
};