module.exports = /*@ngInject*/function ($rootScope, $state, $modal, $timeout) {
	const self = this;

	let isInitialized = false;
	let delayedPopup = null;

	$rootScope.whenInitialized(() => {
		isInitialized = true;
		if (delayedPopup) {
			delayedPopup.windowClass = 'no-animation-modal';
			self.createPopup(delayedPopup);
			delayedPopup = null;
		}
	});

	this.currentModal = null;
	let openedDialogs = 0;

	this.registerDialog = (dialogPromise) => {
		openedDialogs++;
		dialogPromise.finally(() => openedDialogs--);
	};

	this.isOpenedDialog = () => openedDialogs > 0;

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

	this.showPopup = (stateName, params) => {
		if (self.currentModal) {
			self.currentModal.close();
			self.currentModal = null;
		}

		stateName = `.popup.${stateName}`;
		if (!params)
			params = {};

		$timeout(() => {
			$state.go(self.getPrimaryStateName($state.current.name) + stateName, params);
		});
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

	this.isPopupState = (name) => name.includes('.popup.');

	this.getPrimaryStateName = (name) => name.replace(/\.popup\..+/, '');
};