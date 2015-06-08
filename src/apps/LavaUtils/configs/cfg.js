module.exports = (LavaboomAPIProvider, LavaboomHttpAPIProvider, coProvider, consts) => {
	LavaboomAPIProvider.url = LavaboomHttpAPIProvider.url = consts.API_URI;
	coProvider.coJS = window.coJS;
};