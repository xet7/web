angular.module(primaryApplicationName).config(function(LavaboomAPIProvider, consts){
	LavaboomAPIProvider.url = consts.API_URI;
});