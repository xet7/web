module.exports = /*@ngInject*/(LavaboomAPIProvider, LavaboomHttpAPIProvider, consts) => {
	LavaboomAPIProvider.url = LavaboomHttpAPIProvider.url = consts.API_URI;
};