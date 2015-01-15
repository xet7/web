angular.module(primaryApplicationName).factory('apiProxy', function($q, $rootScope, $translate, co, LavaboomAPI) {
	LavaboomAPI.formatError = (callName, error) => {
		callName = callName.toUpperCase();

		/*jshint -W002 */
		return co(function *(){
			try {
				return yield $translate(`LAVABOOM.API.ERROR.${callName}.${error.status}`);
			} catch (err) {
				try {
					return yield $translate(`LAVABOOM.API.ERROR.${error.status}`);
				} catch (err) {
					if (error.body && error.body.message)
						return error.body.message;

					// huh? wtf!
					try {
						return yield $translate(`LAVABOOM.API.ERROR.UNKNOWN`);
					} catch (err) {
						// srsly? wtf!
						return 'unknown error';
					}
				}
			}
		});
	};

	return function () {
		var fnArgs = [].splice.call(arguments,0);
		var args = fnArgs.splice(-1)[0];
		var callName = fnArgs.join('.');

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
				LavaboomAPI.formatError(callName, err)
					.then(formattedError => {
						$rootScope.currentErrorMessage = formattedError;
					});

				console.error(`${callName} error: `, err);

				throw err;
			}
		});
	};
});