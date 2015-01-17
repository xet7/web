angular.module(primaryApplicationName).controller('CtrlLavaboomLogin', function($rootScope, $scope, $sce, crypto, user) {
	crypto.initialize();
    user.checkAuth();
});