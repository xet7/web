module.exports = /*@ngInject*/($timeout, $state) => ({
	restrict : 'A',
	scope: {
		eventFilter: '&'
	},
	link:  (scope, elem) => {
		window.addEventListener('dragover', e => {
			if (!scope.eventFilter({name: 'dragover', event: e}))
				e.preventDefault();
		}, false);
		window.addEventListener('drop', e => {
			if (!scope.eventFilter({name: 'drop', event: e}))
				e.preventDefault();
		}, false);
	}
});