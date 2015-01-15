angular.module(primaryApplicationName).factory('apiProxy', function($q, $rootScope, co, LavaboomAPI) {
	LavaboomAPI.formatError = (err) => err.body && err.body.message ? err.body.message : 'unknown error';

	return function () {
		var fnArgs = [].splice.call(arguments,0);
		var args = fnArgs.splice(-1)[0];
		var callName = `LavaboomAPI.${fnArgs.join('.')}`;

		console.log(`Calling ${callName}`, args ? args : '[no args]', '...');

		return co(function *(){
			try {
				var call = LavaboomAPI;
				fnArgs.forEach(a => {
					call = call[a];
					if (!call) {
						console.error(`undefined API call - no such call '${callName}'!`);
						return;
					}
				});
				var res = yield call.apply(call, [args]);

				console.log(`${callName}: `, res);

				return res;
			} catch (err) {
				$rootScope.currentErrorMessage = LavaboomAPI.formatError(err);

				console.error(`${callName} error: `, err);

				throw err;
			}
		});
	};
});