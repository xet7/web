module.exports = (LavaboomAPIProvider, LavaboomHttpAPIProvider, consts) => {
	LavaboomAPIProvider.url = LavaboomHttpAPIProvider.url = consts.API_URI;
};