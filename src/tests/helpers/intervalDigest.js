/**
 * 	INFO: dirty hack to over come angular-co wrapper
 * 	that doesn't give hook on generator resolve before digest
 */

let rootScopeUpdateIntervalId;
module.exports = {
	start: (interval = 1000)=>
		inject(($rootScope) =>
			rootScopeUpdateIntervalId = setInterval(() => {
				console.info('...still waiting for crypto response');
				$rootScope.$digest();
			}, interval)
		),
	stop: () =>
		() =>
			clearInterval(rootScopeUpdateIntervalId)
};