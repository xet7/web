angular.module('AppLavaboomLogin').controller('LoginController', function($scope, openpgp, LavaboomAPI) {
	openpgp.initialize();
	$scope.auth = [];

	/*	$scope.logIn = function(){
			LavaboomAPI.tokens.create({
				"token":"",
				"type":"auth",
				"username": "kseniya",
				"password": "fancypassword"
		}).then(function (data) {
		}).catch(function (err) {
			console.log(err);
		});
*/
		/*LavaboomAPI.accounts.create.classic({
			"username": $scope.auth.username,
			"password": CryptoJS.SHA3($scope.auth.password, { outputLength: 256 }).toString(),
			"email": $scope.auth.email

		}).then(function(resp) {
			console.log(resp);
		}).catch(function(err) {
			console.log(err);
		});
	};*/

	var t = Date.now();
	openpgp.generateOpenpgpKeys('test@test', 'wubwub', 1024)
		.then(function(keyPair) {
			console.log('openpgp: key pair is', keyPair.privateKeyArmored, keyPair.publicKeyArmored, 'time', Date.now() - t);
		});
});