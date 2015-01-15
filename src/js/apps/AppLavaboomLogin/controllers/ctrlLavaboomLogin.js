angular.module(primaryApplicationName).controller('CtrlLavaboomLogin', function($scope, user) {
    user.checkAuth();
});