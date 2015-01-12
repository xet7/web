angular.module('AppLavaboom').controller('MailListController', function($scope, LavaboomAPI) {
    LavaboomAPI.emails.list({
        "sort": "+date_created"
    }).then(function(resp) {
        console.log(resp);
    }).catch(function(err) {
        console.log(err);
    });
});
