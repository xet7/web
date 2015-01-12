angular.module('AppLavaboomLogin').controller('SecureController', function($scope, LavaboomAPI,$location) {
    $scope.signUp=[];
    $scope.secure=function()
    {
       LavaboomAPI.accounts.reserve.username({
        "username": $scope.signUpSecure.username,
        "email": $scope.signUpSecure.email
    }).then(function(resp) {
        //$location.url('');
        console.log(resp);
    }).catch(function(err) {
        console.log(err);
    });
      /*  LavaboomAPI.accounts.create.classic({
            "username": $scope.signUp.username,
            "password": CryptoJS.SHA3($scope.signUp.password, { outputLength: 256 }).toString(),
            "email": $scope.signUp.email
        }).then(function(resp) {
            console.log(resp);
        }).catch(function(err) {
        console.log(err);
    });*/
    };
});