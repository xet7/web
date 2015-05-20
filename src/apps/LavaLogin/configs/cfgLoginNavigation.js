module.exports = /*@ngInject*/($stateProvider, $urlRouterProvider, $locationProvider) => {
	$locationProvider.html5Mode(true);

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
			templateUrl: 'LavaLogin/login/loginOrSignup'
		})

		.state('decrypting', {
			url: '/decrypting',
			templateUrl: 'LavaLogin/login/decrypting'
		})

		.state('auth', {
			url: '/auth',
			templateUrl: 'LavaLogin/login/auth',
			controller:'CtrlAuth'
		})

		.state('invite', {
			url: '/invite',
			templateUrl: 'LavaLogin/login/invite'
		})

		.state('secureUsername', {
			url: '/secure',
			templateUrl: 'LavaLogin/login/secureUsername',
			controller:'CtrlSecureUsername'
		})

		.state('reservedUsername', {
			url: '/reserved',
			templateUrl: 'LavaLogin/login/reservedUsername',
			controller:'CtrlReservedUsername'
		})

		.state('verifyInvite', {
			url: '/verify',
			templateUrl: 'LavaLogin/login/verifyInvite',
			controller:'CtrlVerify'
		})

		.state('verifyInviteConfigured', {
			url: '/verify/{userName}/{inviteCode}',
			templateUrl: 'LavaLogin/login/verifyInvite',
			controller:'CtrlVerify'
		})

		.state('plan', {
			url: '/plan',
			templateUrl: 'LavaLogin/login/plan',
			controller:'CtrlSelectPlan'
		})

		.state('details', {
			url: '/details',
			templateUrl: 'LavaLogin/login/details',
			controller:'CtrlDetails'
		})

		.state('choosePassword', {
			url: '/password',
			templateUrl: 'LavaLogin/login/choosePassword',
			controller:'CtrlPassword'
		})

		.state('choosePasswordIntro', {
			url: '/password/intro',
			templateUrl: 'LavaLogin/login/choosePasswordIntro',
			controller:'CtrlPassword'
		})

		.state('generateKeys', {
			url: '/keys/intro',
			templateUrl: 'LavaLogin/login/generateKeys',
			controller: 'CtrlGenerateKeys'
		})

		.state('generatingKeys', {
			url: '/keys',
			templateUrl: 'LavaLogin/login/generatingKeys',
			controller: 'CtrlGeneratingKeys'
		})

		.state('backupKeys', {
			url: '/keys/backup',
			templateUrl: 'LavaLogin/login/backupKey',
			controller: 'CtrlBackup'
		})

		.state('importKeys', {
			url: '/keys/import',
			templateUrl: 'LavaLogin/login/importKey'
		});
};