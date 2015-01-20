angular.module(primaryApplicationName).controller('CtrlLavaboomLogin', function($rootScope, $scope, $sce, crypto, loader) {
	loader.incProgress('Initializing openpgp.js strong cryptography...', 5);

	crypto.initialize();

	loader.showLoginApplication();
});