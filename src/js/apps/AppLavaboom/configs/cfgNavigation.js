angular.module(primaryApplicationName).config(function($stateProvider, $urlRouterProvider, $locationProvider){
	$locationProvider.hashPrefix('!');

	// small hack - both routers(login && main app) work at the same time, so we need to troubleshot this
	$urlRouterProvider.otherwise(($injector, $location) => {
		console.log('main router otherwise: window.loader.isMainApplication()', window.loader.isMainApplication(), $location);
		if (!window.loader.isMainApplication())
			return undefined;
		return '/label/Inbox';
	});

	var primaryStates = {
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
					templateUrl: 'partials/left_panel.html',
					controller: 'CtrlNavigation'
				}
			}
		},

		'main.label': {
			url: '/label/:labelName',
			views: {
				'main-view@': {
					templateUrl: 'partials/inbox.html'
				}
			}
		},

		'main.contacts' : {
			url: '/contacts',
			views: {
				'main-view@': {
					templateUrl: 'partials/contacts.html'
				}
			}
		},

		'main.contacts.profile': {
			url: '/profile',
			templateUrl: 'partials/contacts/contacts.profile.html'
		},

		'main.settings' : {
			url: '/settings',
			views: {
				'main-view@': {
					templateUrl: 'partials/settings.html'
				}
			}
		},

		'main.settings.preferences': {
			url: '/preferences',
			templateUrl: 'partials/settings/settings.preferences.html'
		},

		'main.settings.profile': {
			url: '/profile',
			templateUrl: 'partials/settings/settings.profile.html'
		},

		'main.settings.security': {
			url: '/security',
			templateUrl: 'partials/settings/settings.security.html'
		},

		'main.settings.plan': {
			url: '/plan',
			templateUrl: 'partials/settings/settings.plan.html'
		}
	};

	var PopupAbstractState = function () {
		this.abstract = true;
		this.data = {
			settings: {
			}
		};
	};

	var popupStates = {
		'compose': function () {
			this.url =  '/compose';
			this.onEnter = ($state, $modal, router) => {
				router.currentModal = $modal.open({
					templateUrl: 'partials/compose.html',
					controller: 'CtrlCompose',
					backdrop: true,
					size: 'lg'
				});
				router.currentModal.result
					.then(() => {
						router.hidePopup();
					})
					.catch(() => {
						router.hidePopup();
					});
			};
			this.onExit = (router) => {
				router.hidePopup();
			};
		}
	};

	var declareState = (name, state) => {
		console.log('creating state ', name);
		$stateProvider.state(name, state);
	};

	for(let stateName in primaryStates) {
		declareState(stateName, primaryStates[stateName]);
		declareState(`${stateName}.popup`, new PopupAbstractState());
		for(let popupStateName in popupStates)
			if (stateName.indexOf('main.') === 0) {
				declareState(`${stateName}.popup.${popupStateName}`, new popupStates[popupStateName]());
			}
	}
});
