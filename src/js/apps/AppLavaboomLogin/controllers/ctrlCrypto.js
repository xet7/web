angular.module('AppLavaboomLogin').controller('CtrlCrypto', function($scope, crypto) {
	$scope.genEmail = 'Tester <test@test.ru>';
	$scope.genPassword = 'testit!';
	$scope.genBits = 1024;
	$scope.genStatus = 'Enter credentials!';
	$scope.isGenerating = false;

	$scope.isRemember = false;
	$scope.password = '';
	$scope.decryptStatus = '';


	$scope.keyPairs = crypto.initialize({
		isRememberPasswords: $scope.isRemember
	});
	$scope.dstEmails = crypto.getAvailableDestinationEmails();
	$scope.srcEmails = crypto.getAvailableSourceEmails();
	$scope.privateKeys = crypto.getAvailablePrivateKeys();
	$scope.privateDecryptedKeys = crypto.getAvailablePrivateDecryptedKeys();

	$scope.selectedKeyPair = {};

	$scope.text = "Hi! I'm super secret message about cats! Did you know that cats are going to conquer the world?... No seriously!";
	$scope.error = '';

	$scope.passwords = {};
	$scope.statuses = {};
	$scope.encodeToEmail = '';
	$scope.decodeForEmail = '';

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

	$scope.authenticate = (privateKey, password) => {
		if (crypto.authenticate(privateKey, password))
			$scope.statuses[privateKey.primaryKey.fingerprint] = 'decoded!';
		else
			$scope.statuses[privateKey.primaryKey.fingerprint] = 'Cannot decode, check your password!';
	};

	$scope.encode = () => {
		console.log(`trying to encode for email ${$scope.encodeToEmail}...`);
		crypto.encode($scope.encodeToEmail, $scope.text)
			.then(message => {
				$scope.text = message;
			})
			.catch(error => {
				$scope.error = error;
			});
	};

	$scope.decode = () => {
		console.log(`trying to decode for email ${$scope.decodeForEmail}...`);
		crypto.decode($scope.decodeForEmail, $scope.text)
			.then(message => {
				$scope.text = message;
			})
			.catch(error => {
				$scope.error = error.message;
				console.log(error);
			});
	};
});