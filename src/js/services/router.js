angular.module(primaryApplicationName).service('router', function ($rootScope, $state, $modal, $timeout) {
	var self = this;

	var isInitialized = false;
	var delayedPopup = null;

	$rootScope.$on('initialization-completed', () => {
		console.log('got initialization-completed event', delayedPopup);
		isInitialized = true;
		if (delayedPopup) {
			self.createPopup(delayedPopup);
			delayedPopup = null;
		}
	});

	this.currentModal = null;

	this.createPopup = (opts) => {
		if (isInitialized) {
			self.currentModal = $modal.open(opts);
			self.currentModal.result
				.then(() => {
					self.hidePopup();
				})
				.catch(() => {
					self.hidePopup();
				});
		} else delayedPopup = opts;
	};

	this.showPopup = (stateName, params, onClose = null) => {
		stateName = `.popup.${stateName}`;

		$state.go(self.getPrimaryStateName($state.current.name) + stateName);
	};

	this.hidePopup = () => {
		if (self.currentModal) {
			self.currentModal.close();
			self.currentModal = null;
		}
		$timeout(() => {
			$state.go(self.getPrimaryStateName($state.current.name));
		});
	};

	this.isPopupState = (name) => name.indexOf('.popup.') > 0;

	this.getPrimaryStateName = (name) => name.replace(/\.popup\..+/, '');
});