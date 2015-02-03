angular.module(primaryApplicationName).config(function(LavaboomAPIProvider){
    LavaboomAPIProvider.setURL(process.env.API_URI ? process.env.API_URI : 'https://api.lavaboom.co');
});