module.exports = ($stateProvider, $urlRouterProvider, $locationProvider) => {
	$locationProvider.hashPrefix('!');

	// small hack - both routers(login && main app) work at the same time, so we need to troubleshot this
	$urlRouterProvider.otherwise(($injector, $location) => {
		console.log('login router otherwise: window.loader.isMainApplication()', window.loader.isMainApplication(), $location);
		if (window.loader.isMainApplication())
			return undefined;
		return '/';
	});

	$stateProvider
		.state('login', {
			url: '/',
			templateUrl: 'partials/login/login-signup.html'
		})

		.state('decrypting', {
			url: '/decrypting',
			templateUrl: 'partials/login/decrypting.html'
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

		.state('importKeys', {
			url: '/importKeys',
			templateUrl: 'partials/login/importKey.html'
		});
};