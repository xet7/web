angular.module('AppLavaboomLogin').controller('CtrlCrypto', function($scope, crypto) {
	$scope.genEmail = 'test@test.ru';
	$scope.genPassword = 'testit!';
	$scope.genBits = 1024;
	$scope.genStatus = 'Enter credentials!';
	$scope.isGenerating = false;

	$scope.decryptStatus = '';
	$scope.keyPairs = crypto.initialize({
		isRememberPasswords: true
	});
	$scope.selectedKeyPair = {};

	$scope.isRemember = false;
	$scope.password = '';

	$scope.text = "Hi! I'm super secret message about cats! Did you know that cats are going to conquer the world?... No seriously!";
	$scope.error = '';

	console.log('key pairs', $scope.keyPairs);

	$scope.onIsRememberChanged = () => {
		crypto.options.isRememberPasswords = $scope.isRemember;
		console.log(crypto.options);
	};

	$scope.generateKeys = () => {
		$scope.isGenerating = true;
		$scope.genStatus = 'Generating...';
		crypto.generateKeys($scope.genEmail, $scope.genPassword, $scope.genBits)
			.then(function(keyPair) {
				$scope.genStatus = `Generated, primary key fingerprint: ${keyPair.primaryKey.fingerprint}`;
			})
			.catch(function(error) {
				$scope.genStatus = error.message;
				console.log(error);
			})
			.finally(() => {
				$scope.isGenerating = false;
				$scope.keyPairs = crypto.keyPairs;
			});
	};

	$scope.authenticate = () => {
		if (crypto.authenticate($scope.selectedKeyPair, $scope.password))
			$scope.decryptStatus = 'decoded!';
		else
			$scope.decryptStatus = 'Cannot decode, check your password!';
	};

	$scope.encode = () => {
		crypto.encode($scope.selectedKeyPair, $scope.text)
			.then(message => {
				$scope.text = message;
			})
			.catch(error => {
				$scope.error = error;
			});
	};

	$scope.decode = () => {
		crypto.decode($scope.selectedKeyPair, $scope.text)
			.then(message => {
				$scope.text = message;
			})
			.catch(error => {
				$scope.error = error.message;
				console.log(error);
			});
	};
});