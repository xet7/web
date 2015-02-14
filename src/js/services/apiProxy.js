angular.module(primaryApplicationName).factory('apiProxy',
	function($q, $rootScope, $translate, co, consts, LavaboomAPI) {
		LavaboomAPI.formatError = (callName, error) => {
			callName = callName.toUpperCase();

			var translate = (name) => co(function *(){
				var r = yield $translate(name);
				if (r == name)
					throw new Error(`Translation '${name}' not found!`);
				return r;
			});

			return co(function *(){
				try {
					if (error.body && error.body.message == 'Unexpected end of input')
						return yield translate(`LAVABOOM.API.ERROR.DOWN`);

					return yield translate(`LAVABOOM.API.ERROR.${callName}.${error.status}`);
				} catch (err) {
					var def = '';
					try {
						def = yield translate(`LAVABOOM.API.ERROR.${callName}.DEFAULT`);
					} catch (e) {}

					try {
						var genericReason = yield translate(`LAVABOOM.API.ERROR.${error.status}`);
						return def ? `${def} (${genericReason})` : genericReason;
					} catch (err) {
						if (error.body && error.body.message)
							return error.body.message;

						// huh? wtf!
						try {
							return yield translate(`LAVABOOM.API.ERROR.UNKNOWN`);
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
					var formattedError = yield LavaboomAPI.formatError(callName, err);
					$rootScope.currentErrorMessage = formattedError;

					console.error(`${callName} error: `, err);

					var error =  new Error(formattedError);
					error.original = err;
					throw error;
				}
			});
		};
	});