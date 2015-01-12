angular.module('AppLavaboomLogin').controller('SecureController', function($scope, LavaboomAPI,$location, $rootScope) {
   if(!$rootScope.signUpSecure)
   {
       $rootScope.signUpSecure=[];
   }

   $scope.secure=function()
    {
       LavaboomAPI.accounts.reserve.username({
        "username": $rootScope.signUpSecure.username,
        "email": $rootScope.signUpSecure.email
    }).then(function(resp) {
        $location.url('reservedUsername');
        //console.log(resp);
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