angular.module(primaryApplicationName).config(function(LavaboomAPIProvider, consts){
    LavaboomAPIProvider.setURL(consts.API_URI);
});