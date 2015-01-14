angular.module(primaryApplicationName).config(function($stateProvider, $urlRouterProvider){
	$urlRouterProvider.otherwise("/in");

	$stateProvider
		.state('in', {
			url: "/in",
			// abstract:true,
			templateUrl: "partials/inbox.html"
		}).state('settings', {
			// abstract:true,
			url: "/settings",
			templateUrl: "partials/settings.html"
		}).state('settings.preferences', {
			// abstract:true,
			url: "/preferences",
			templateUrl: "partials/settings/settings.preferences.html"
		}).state('settings.profile', {
			// abstract:true,
			url: "/profile",
			templateUrl: "partials/settings/settings.profile.html"
		}).state('settings.security', {
			// abstract:true,
			url: "/security",
			templateUrl: "partials/settings/settings.security.html"
		}).state('settings.plan', {
			// abstract:true,
			url: "/plan",
			templateUrl: "partials/settings/settings.plan.html"
		}).state('login.login', {
			// abstract:true,
			url: "/login",
			templateUrl: "partials/login/login.html"
		});
});