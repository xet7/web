angular.module('AppLavaboom').config(function($stateProvider, $urlRouterProvider, $locationProvider){
	$locationProvider.hashPrefix('!');
	$urlRouterProvider.otherwise('/in');

	$stateProvider
		.state('in', {
			url: '/in',
			templateUrl: 'partials/inbox.html'
		})
		.state('settings', {
			url: '/settings',
			templateUrl: 'partials/settings.html'
		})
		.state('compose', {
			url: '/compose',
			templateUrl: 'partials/compose.html',
			controller:'ComposeController'
		})
		.state('settings.preferences', {
			url: '/preferences',
			templateUrl: 'partials/settings/settings.preferences.html'
		})
		.state('settings.profile', {
			url: '/profile',
			templateUrl: 'partials/settings/settings.profile.html'
		})
		.state('settings.security', {
			url: '/security',
			templateUrl: 'partials/settings/settings.security.html'
		})
		.state('settings.plan', {
			url: '/plan',
			templateUrl: 'partials/settings/settings.plan.html'
		})
		.state('login.login', {
			url: '/login',
			templateUrl: 'partials/login/login1.html'
		});
});