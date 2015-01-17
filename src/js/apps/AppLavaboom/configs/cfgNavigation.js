angular.module('AppLavaboom').config(function($stateProvider, $urlRouterProvider, $locationProvider){
	$locationProvider.hashPrefix('!');
	$urlRouterProvider.otherwise('/in');


	$stateProvider
		.state('decrypting', {
			url: '/decrypting',
			views: {
				'login-view': {
					templateUrl: 'partials/login/decrypting.html'
				}
			}
		})

		.state('main', {
			abstract: true,

			views: {
				'left-view': {
					templateUrl: 'partials/left_panel.html'
				}
			}
		})

		.state('main.in', {
			url: '/in',
			views: {
				'main-view@': {
					templateUrl: 'partials/inbox.html'
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