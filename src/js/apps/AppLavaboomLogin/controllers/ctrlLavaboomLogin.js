angular.module(primaryApplicationName).controller('CtrlLavaboomLogin', function($rootScope, $scope, $sce, user) {
	crypto.initialize();
    user.checkAuth();
});