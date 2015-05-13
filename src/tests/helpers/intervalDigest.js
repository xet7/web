/**
 * 	INFO: dirty hack to over come angular-co wrapper
 * 	that doesn't give hook on generator resolve before digest
 */

let rootScopeUpdateIntervalId;
module.exports = {
	start: inject(($rootScope) => {
		rootScopeUpdateIntervalId = setInterval(() => {
			console.info('...still waiting for crypto response');
			$rootScope.$digest();
		}, 1000);
	}),
	stop: () =>
		clearInterval(rootScopeUpdateIntervalId)
};