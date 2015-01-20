angular.module(primaryApplicationName).config(function($stateProvider, $urlRouterProvider, $locationProvider){
	$locationProvider.hashPrefix('!');
	$urlRouterProvider.otherwise('/loading');

	$stateProvider
		.state('loading', {
			url: '/loading'
		})
		.state('decrypting', {
			url: '/decrypting',
			views: {
				'login-view': {
					templateUrl: 'partials/login/decrypting.html',
					controller: 'CtrlDecrypting'
				}
			}
		})

		.state('main', {
			abstract: true,

			views: {
				'left-view': {
					templateUrl: 'partials/left_panel.html',
					controller: 'CtrlNavigation'
				}
			}
		})

		.state('main.label', {
			url: '/label/:labelName',
			views: {
				'main-view@': {
					templateUrl: 'partials/inbox.html' //stateParams => `partials/${stateParams.labelName.toLowerCase()}.html`
				}
			}
		})

		.state('main.settings', {
			url: '/settings',
			views: {
				'main-view@': {
					templateUrl: 'partials/settings.html'
				}
			}
		})

		.state('main.compose', {
			url: '/compose',
			views: {
				'main-view@': {
					templateUrl: 'partials/compose.html',
					controller: 'ComposeController'
				}
			}
		})

		.state('main.settings.preferences', {
			url: '/preferences',
			templateUrl: 'partials/settings/settings.preferences.html'
		})

		.state('main.settings.profile', {
			url: '/profile',
			templateUrl: 'partials/settings/settings.profile.html'
		})

		.state('main.settings.security', {
			url: '/security',
			templateUrl: 'partials/settings/settings.security.html'
		})

		.state('main.settings.plan', {
			url: '/plan',
			templateUrl: 'partials/settings/settings.plan.html'
		});
});