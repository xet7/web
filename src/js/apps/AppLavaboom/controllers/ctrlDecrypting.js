angular.module('AppLavaboom').controller('CtrlDecrypting', function($scope, inbox) {
	$scope.$on('user-authenticated', () => {
		inbox.requestList();
		cryptoKeys.syncKeys();
	});
});