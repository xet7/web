angular.module(primaryApplicationName).controller('CtrlLavaboomLogin', function($rootScope, $scope, $sce, user) {
    user.checkAuth();

	$rootScope.trustedHtml = function(html) {
		return $sce.trustAsHtml(html);
	};
});