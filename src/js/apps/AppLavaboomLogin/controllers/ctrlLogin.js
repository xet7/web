angular.module('AppLavaboomLogin').controller('LoginController', function($scope, openpgp, LavaboomAPI) {
	openpgp.initialize();
	$scope.auth = [];

	$scope.logIn = function(){
		$scope.auth.password = CryptoJS.SHA3($scope.auth.password, { outputLength: 256 });
		$scope.login={"username":$scope.auth.username,"password":$scope.auth.password,"type":"auth"};
		LavaboomAPI.tokens.create($scope.login).then(function () {
			//debugger;
		}).catch(function () {
			//	debugger;
		});
	};

	var t = Date.now();
	openpgp.generateOpenpgpKeys('test@test', 'wubwub', 1024)
		.then(function(keyPair) {
			console.log('openpgp: key pair is', keyPair.privateKeyArmored, keyPair.publicKeyArmored, 'time', Date.now() - t);
		});
});