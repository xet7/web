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
            controller:"CtrlAuth"
        }).state('invite', {
            url: "/invite",
            templateUrl: "partials/login/invite.html"
        }).state('secureUsername', {
            url: "/secureUsername",
            templateUrl: "partials/login/secureUsername.html",
            controller:"CtrlSecure"
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
            templateUrl: "partials/login/plan.html"
        }).state('details', {
            url: "/details",
            templateUrl: "partials/login/details.html",
            controller:"CtrlDetails"
        }).state('choosePassword', {
            url: "/choosePassword",
            templateUrl: "partials/login/choosePassword.html",
            controller:"VerifyController"
        }).state('choosePasswordIntro', {
            url: "/choosePasswordIntro",
            templateUrl: "partials/login/choosePasswordIntro.html"
        }).state('generateKeys', {
            url: "/generateKeys",
            templateUrl: "partials/login/generateKeys.html",
            controller:"VerifyController"
        }).state('generatingKeys', {
            url: "/generatingKeys",
            templateUrl: "partials/login/generatingKeys.html",
            controller:'GenerateKeysController'
        });//generatingKeys
});