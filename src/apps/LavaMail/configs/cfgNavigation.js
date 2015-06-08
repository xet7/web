module.exports = ($stateProvider, $urlRouterProvider, $locationProvider) => {
	$locationProvider.html5Mode(true);

	// small hack - both routers(login && main app) work at the same time, so we need to troubleshot this
	$urlRouterProvider.otherwise(($injector, $location) => {
		console.log('main router otherwise: window.loader.isMainApplication()', window.loader.isMainApplication(), $location);
		if (!window.loader.isMainApplication())
			return undefined;
		return '/label/inbox/';
	});

	const primaryStates = {
		'empty': {
			url: '/'
		},

		'modal' : {
			url: '/modal'
		},

		'main': {
			abstract: true,

			views: {
				'left-view': {
					templateUrl: 'LavaMail/navigation/navigation',
					controller: 'CtrlNavigation'
				}
			}
		},

		'main.inbox': {
			url: '/label/:labelName',
			views: {
				'main-view@': {
					templateUrl: 'LavaMail/inbox/inbox'
				},
				'threads@main.inbox': {
					templateUrl: 'LavaMail/inbox/threads',
					controller: 'CtrlThreadList'
				}
			}
		},

		'main.inbox.label': {
			url: '/:threadId',

			views: {
				'emails@main.inbox': {
					templateUrl: 'LavaMail/inbox/emails',
					controller: 'CtrlEmailList'
				}
			}
		},

		'main.contacts' : {
			url: '/contacts',
			views: {
				'main-view@': {
					templateUrl: 'LavaMail/contacts/contacts'
				}
			}
		},

		'main.contacts.profile': {
			url: '/profile/:contactId?email',
			templateUrl: 'LavaMail/contacts/contactsProfile',
			controller: 'CtrlContactProfile'
		},

		'main.settings' : {
			url: '/settings',
			views: {
				'main-view@': {
					templateUrl: 'LavaMail/settings/settings'
				}
			}
		},

		'main.settings.general': {
			url: '/general',
			templateUrl: 'LavaMail/settings/settingsGeneral'
		},

		'main.settings.profile': {
			url: '/profile',
			templateUrl: 'LavaMail/settings/settingsProfile'
		},

		'main.settings.security': {
			url: '/security',
			templateUrl: 'LavaMail/settings/settingsSecurity'
		},

		'main.settings.plan': {
			url: '/plan',
			templateUrl: 'LavaMail/settings/settingsPlan'
		}
	};

	function PopupAbstractState () {
		this.abstract = true;
	}

	const popupStates = {
		'compose': function () {
			this.url =  '/compose?replyThreadId&replyEmailId&isReplyAll&forwardEmailId&forwardThreadId&to&publicKey';

			// @ngInject
			this.onEnter = (router) => {
				router.createPopup({
					templateUrl: 'LavaMail/compose/compose',
					controller: 'CtrlCompose',
					backdrop: 'static',
					size: 'lg'
				});
			};
		},
		'hotkeys': function () {
			this.url =  '/hotkeys';

			// @ngInject
			this.onEnter = (router) => {
				router.createPopup({
					templateUrl: 'LavaMail/misc/hotkeys',
					controller: 'CtrlHotkeys',
					backdrop: 'static',
					size: 'lg'
				});
			};
		},
		'download': function () {
			this.url =  '/download/:emailId/:fileId';

			// @ngInject
			this.onEnter = (router) => {
				router.createPopup({
					templateUrl: 'LavaMail/inbox/download',
					controller: 'CtrlDownload',
					backdrop: 'static',
					size: 'lg'
				});
			};
		},
		'importContacts': function () {
			this.url =  '/import/contacts/';

			// @ngInject
			this.onEnter = (router) => {
				router.createPopup({
					templateUrl: 'LavaMail/contacts/import',
					controller: 'CtrlImportContacts',
					backdrop: 'static',
					size: 'sm'
				});
			};
		}

	};

	const declareState = (name, state) => {
		console.log('creating state ', name);
		$stateProvider.state(name, state);
	};

	for(let stateName of Object.keys(primaryStates)) {
		declareState(stateName, primaryStates[stateName]);

		if (!primaryStates[stateName].abstract) {
			declareState(`${stateName}.popup`, new PopupAbstractState());
			for (let popupStateName in popupStates)
				if (stateName.indexOf('main.') === 0) {
					declareState(`${stateName}.popup.${popupStateName}`, new popupStates[popupStateName]());
				}
		}
	}
};