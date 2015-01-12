angular.module('AppLavaboom').controller('ComposeController', function($scope,  LavaboomAPI) {
    LavaboomAPI.emails.create({
        "to": "kuprina.ks@gmail.com",
       "bcc": "kuprina.ks@gmail.com",
       "reply_to":"",
       "thread_id": "",
        "subject": "Lavaboom master race!",
        "is_encrypted": false,
        "body": "Check out this cool new email service!",
       "body_version_major":1,
       "body_version_minor": 1,
       "preview": "",
       "preview_version_major": "",
       "preview_version_minor": "",
       "attachments": "",
       "pgp_fingerprints": "",
        "token":"3sPpg18YqdzpqJKtAziz"






    }).then(function(resp) {
        console.log(resp);
    }).catch(function(err) {
        console.log(err);
    });
});