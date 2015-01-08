angular.module('AppLavaboomLogin').controller('CtrlCrypto', function($scope, crypto) {
	$scope.genEmail = 'test@test.ru';
	$scope.genPassword = 'testit!';
	$scope.genBits = 1024;
	$scope.isGenerating = false;

	$scope.keyPairs = crypto.getKeyPairs();
	$scope.selectedKeyPair = {};
	$scope.password = '';

	$scope.text = "Hi! I'm super secret message about cats! Did you know that cats are going to conquer the world?... No seriously!";
	$scope.error = '';

	crypto.initialize();

	console.log('key pairs', $scope.keyPairs);

	$scope.generateKeys = () => {
		$scope.isGenerating = true;
		crypto.generateOpenpgpKeys($scope.genEmail, $scope.genPassword, $scope.genBits)
			.then(function(keyPair) {
				console.log("openpgp: key pair is", keyPair.publicKeyArmored, keyPair.privateKeyArmored);
			})
			.catch(function(err) {
				console.error("can't generate key pair: ", err);
			});
	};

	$scope.authenticate = () => {
		crypto.authenticate($scope.keyPairs[$scope.selectedKeyPair].prv, $scope.password);
	};

	$scope.encode = () => {
		crypto.encode($scope.keyPairs[$scope.selectedKeyPair].pub, $scope.text)
			.then(message => {
				$scope.text = message;
			})
			.catch(error => {
				$scope.error = error;
			});
	};

	$scope.decode = () => {
		crypto.decode($scope.keyPairs[$scope.selectedKeyPair].prv, $scope.text)
			.then(message => {
				$scope.text = message;
			})
			.catch(error => {
				$scope.error = error.message;
				console.log(error);
			});
	};
});
