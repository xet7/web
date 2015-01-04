angular.module(primaryApplicationName).factory('apiProxy', function($q, co, LavaboomAPI) {
	return function (obj, method, args) {
		var callName = `LavaboomAPI.${obj}.${method}`;

		console.log(`Calling ${callName}`, args ? args : '[no args]', '...');

		return co(function *(){
			try {
				if (!LavaboomAPI[obj]) {
					console.error(`undefined API call - no such object '${obj}'`);
					return;
				}

				if (!LavaboomAPI[obj][method]) {
					console.error(`undefined API call - no such method '${method}' in object '${obj}'`);
					return;
				}

				var call = LavaboomAPI[obj][method];
				var res = yield call.apply(call, [args]);

				console.log(`${callName}: `, res);

				return res;
			} catch (err) {
				console.error(`${callName} error: `, err.message, err.stack);

				throw err;
			}
		});
	};
});