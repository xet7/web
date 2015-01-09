angular.module('AppLavaboomLogin').controller('CtrlCrypto', function($scope, crypto, cryptoKeys) {
	$scope.genEmail = 'Tester <test@test.ru>';
	$scope.genPassword = 'testit!';
	$scope.genBits = 1024;
	$scope.genStatus = 'Enter credentials!';
	$scope.isGenerating = false;

	$scope.isRemember = false;

	crypto.initialize({
		isRememberPasswords: $scope.isRemember
	});
	$scope.dstEmails = crypto.getAvailableDestinationEmails();
	$scope.srcEmails = crypto.getAvailableSourceEmails();
	$scope.privateKeys = crypto.getAvailablePrivateKeys();
	$scope.privateDecryptedKeys = crypto.getAvailablePrivateDecryptedKeys();

	$scope.$on('crypto-dst-emails-updated', (e, emails) => {
		console.log('got crypto-dst-emails-updated', emails);
		$scope.dstEmails = emails;
	});

	$scope.$on('crypto-src-emails-updated', (e, emails) => {
		console.log('got crypto-src-emails-updated', emails);
		$scope.srcEmails = emails;
	});

	$scope.text = "Hi! I'm super secret message about cats! Did you know that cats are going to conquer the world?... No seriously!";
	$scope.error = '';

	$scope.passwords = {};
	$scope.statuses = {};
	$scope.encodeToEmail = '';
	$scope.decodeForEmail = '';

	$scope.onIsRememberChanged = () => {
		crypto.options.isRememberPasswords = $scope.isRemember;
		console.log(crypto.options);
	};

	$scope.generateKeys = () => {
		$scope.isGenerating = true;
		$scope.genStatus = 'Generating...';
		crypto.generateKeys($scope.genEmail, $scope.genPassword, $scope.genBits)
			.then(function(keyPair) {
				$scope.genStatus = `Generated, primary key fingerprint: ${keyPair.prv.primaryKey.fingerprint}`;
			})
			.catch(function(error) {
				$scope.genStatus = error.message;
				console.log(error);
			})
			.finally(() => {
				$scope.isGenerating = false;
			});
	};

	$scope.authenticate = (privateKey, password) => {
		if (crypto.authenticate(privateKey, password))
			$scope.statuses[privateKey.primaryKey.fingerprint] = 'decoded! ';
		else
			$scope.statuses[privateKey.primaryKey.fingerprint] = 'Cannot decode, check your password! ';
		$scope.privateKeys = crypto.getAvailablePrivateKeys();
		$scope.privateDecryptedKeys = crypto.getAvailablePrivateDecryptedKeys();
	};

	$scope.changePassword = (privateKey, password) => {
		if (crypto.changePassword(privateKey, password))
			$scope.statuses[privateKey.primaryKey.fingerprint] = 'password updated! ';
		else
			$scope.statuses[privateKey.primaryKey.fingerprint] = 'Cannot update password! ';
		$scope.privateKeys = crypto.getAvailablePrivateKeys();
		$scope.privateDecryptedKeys = crypto.getAvailablePrivateDecryptedKeys();
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

	$scope.importKeys = () => {

	};

	$scope.exportKeys = () => {

	};
});
