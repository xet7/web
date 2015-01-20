angular.module(primaryApplicationName).factory('apiProxy', function($q, $rootScope, $translate, co, LavaboomAPI) {
	LavaboomAPI.formatError = (callName, error) => {
		callName = callName.toUpperCase();

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

	$rootScope.$on('$stateChangeSuccess', () => {
		$rootScope.currentErrorMessage = '';
	});

	return function () {
		var fnArgs = [].splice.call(arguments,0);
		var path = fnArgs[0];
		var callArgs = fnArgs.slice(1);
		var callName = path.join('.');

		console.log(`Calling ${callName}`, callArgs ? callArgs : '[no args]', '...');

		return co(function *(){
			try {
				var call = LavaboomAPI;
				path.forEach(a => {
					call = call[a];
					if (!call)
						console.error(`undefined API call - no such call '${callName}'!`);
				});
				var res = yield call.apply(call, callArgs);

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