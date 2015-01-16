angular.module('AppLavaboomLogin').config(function($stateProvider, $urlRouterProvider, $locationProvider){
	$locationProvider.hashPrefix('!');
	$urlRouterProvider.otherwise('/');
	
    $stateProvider
       .state('login', {
            url: '/',
            templateUrl: 'partials/login/login-signup.html'
        })
		.state('auth', {
            url: '/auth',
            templateUrl: 'partials/login/auth.html',
            controller:'CtrlAuth'
        })
		.state('invite', {
            url: '/invite',
            templateUrl: 'partials/login/invite.html'
        })
		.state('secureUsername', {
            url: '/secureUsername',
            templateUrl: 'partials/login/secureUsername.html',
            controller:'CtrlSecureUsername'
        })
		.state('reservedUsername', {
            url: '/reservedUsername',
            templateUrl: 'partials/login/reservedUsername.html',
			controller:'CtrlReservedUsername'
		})
		.state('verifyInvite', {
            url: '/verifyInvite',
            templateUrl: 'partials/login/verifyInvite.html',
            controller:'VerifyController'
        })
		.state('plan', {
            url: '/plan',
            templateUrl: 'partials/login/plan.html',
			controller:'CtrlSelectPlan'
        })
		.state('details', {
            url: '/details',
            templateUrl: 'partials/login/details.html',
            controller:'CtrlDetails'
        })
		.state('choosePassword', {
            url: '/choosePassword',
            templateUrl: 'partials/login/choosePassword.html',
            controller:'CtrlPassword'
        })
		.state('choosePasswordIntro', {
            url: '/choosePasswordIntro',
            templateUrl: 'partials/login/choosePasswordIntro.html',
			controller:'CtrlPassword'
        })
		.state('generateKeys', {
            url: '/generateKeys',
            templateUrl: 'partials/login/generateKeys.html',
            controller: 'CtrlGenerateKeys'
        })
		.state('generatingKeys', {
            url: '/generatingKeys',
            templateUrl: 'partials/login/generatingKeys.html',
            controller: 'CtrlGeneratingKeys'
        })
		.state('backupKeys', {
			url: '/backupKeys',
			templateUrl: 'partials/login/backupKey.html',
			controller: 'CtrlBackup'
		})
		.state('backupKeys', {
			url: '/backupKeys',
			templateUrl: 'partials/login/backupKey.html',
			controller: 'CtrlBackup'
		});
});