angular.module('AppLavaboomLogin').controller('AuthController', function($scope, openpgp, LavaboomAPI,$location) {
    openpgp.initialize();
    $scope.auth = [];

    $scope.logIn = function(){
      	LavaboomAPI.tokens.create({
         "token":"",
         "type":"auth",
         "username": $scope.auth.username,
         "password": CryptoJS.SHA3($scope.auth.password, { outputLength: 256 }).toString()
         }).then(function (data) {
            LavaboomAPI.setAuthToken(data.token.id);
            //LavaboomAPI.setAuthToken(data.token.id);
           // $location.absUrl("http://0.0.0.0:5000/");
           /* $location.path("http://0.0.0.0:5000/index.html");
            $location.replace();*/
          window.location="http://127.0.0.1:5000/";
         }).catch(function (err) {
         console.log(err);
         });
        };

    /*var t = Date.now();
    openpgp.generateOpenpgpKeys('test@test', 'wubwub', 1024)
        .then(function(keyPair) {
            console.log('openpgp: key pair is', keyPair.privateKeyArmored, keyPair.publicKeyArmored, 'time', Date.now() - t);
        });*/
});