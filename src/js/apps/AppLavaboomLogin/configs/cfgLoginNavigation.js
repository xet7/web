angular.module('AppLavaboomLogin').config(function($stateProvider, $urlRouterProvider){
    // For any unmatched url, send to /route1
   $urlRouterProvider.otherwise("/");
    $stateProvider
       .state('login', {
            url: "/",
            templateUrl: "partials/login/login-signup.html"
        }).state('auth', {
            url: "/auth",
            templateUrl: "partials/login/auth.html",
            controller:"AuthController"
        }).state('invite', {
            url: "/invite",
            templateUrl: "partials/login/invite.html"
        }).state('secureUsername', {
            url: "/secureUsername",
            templateUrl: "partials/login/secureUsername.html",
            controller:"SecureController"
        }).state('reservedUsername', {
            url: "/reservedUsername",
            templateUrl: "partials/login/reservedUsername.html",
            controller:"SecureController"
        }).state('verifyInvite', {
            url: "/verifyInvite",
            templateUrl: "partials/login/verifyInvite.html",
            controller:"VerifyController"
        }).state('plan', {
            url: "/plan",
            templateUrl: "partials/login/plan.html",
            controller:"VerifyController"
        }).state('details', {
            url: "/details",
            templateUrl: "partials/login/details.html",
            controller:"VerifyController"
        }).state('choose', {
            url: "/choose",
            templateUrl: "partials/login/choose.html",
            controller:"VerifyController"
        }).state('configuring', {
            url: "/configuring",
            templateUrl: "partials/login/configuring.html",
            controller:"VerifyController"
        });
});