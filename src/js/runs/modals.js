angular.module(primaryApplicationName).run(function ($rootScope, $modal) {
	$rootScope.$on('$stateChangeStart', function (event, toState) {
		if (toState.name !== 'modal') return;

		$modal.open({
			template: [
				'<div class="modal-content">',
				'<div class="modal-header">',
				'<h3 class="modal-title">Regulamin</h3>',
				'</div>',
				'<div class="modal-body">',
				'$1. Give us all your money!',
				'</div>',
				'<div class="modal-footer">',
				'<button class="btn btn-primary" ng-click="$dismiss()">OK</button>',
				'</div>',
				'</div>'
			].join(''),
			controller: function($scope){
				// Do whatever you need here.
			}
		});

		event.preventDefault();
	});
});