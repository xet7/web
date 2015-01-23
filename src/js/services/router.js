angular.module(primaryApplicationName).service('router', function ($rootScope, $state, $timeout) {
	var self = this;

	this.currentModal = null;
	var stateNameWithoutPopup = (name) => name.replace(/\.popup\..+/, '');

	this.showPopup = (stateName, params, onClose = null) => {
		stateName = `.popup.${stateName}`;

		$state.go(stateNameWithoutPopup($state.current.name) + stateName);
	};

	this.hidePopup = () => {
		if (self.currentModal) {
			self.currentModal.close();
			self.currentModal = null;
		}
		$timeout(() => {
			$state.go(stateNameWithoutPopup($state.current.name));
		});
	};

	this.isPopupState = function (name) {
		return name.indexOf('.popup.') > 0;
	};
});