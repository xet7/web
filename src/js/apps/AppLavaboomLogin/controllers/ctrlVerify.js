angular.module('AppLavaboomLogin').controller('VerifyController', function($scope, openpgp, LavaboomAPI) {
$scope.invite=[];

    $scope.send=function() {
        LavaboomAPI.accounts.reserve.invited({
            "username": $scope.invite.username,
            "password": CryptoJS.SHA3($scope.invite.password, {outputLength: 256}).toString(),
            "token": $scope.invite.token
        }).then(function (resp) {
            console.log(resp);
        }).catch(function (err) {
            console.log(err);
        });
      /*  LavaboomAPI.accounts.create.invited({
            "username": $scope.invite.username,
            "password": CryptoJS.SHA3($scope.invite.password, {outputLength: 256}).toString(),
            "token": $scope.invite.token
        }).then(function (resp) {
            console.log(resp);
        }).catch(function (err) {
            console.log(err);
        });*/
    };
});

//oiFcopQPcXsgjv3AiBgI