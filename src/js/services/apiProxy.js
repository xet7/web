angular.module(primaryApplicationName).factory('apiProxy', function($q, co, LavaboomAPI) {
	return function (obj, method, args) {
		var callname = `LavaboomAPI.${obj}.${method}`;

		console.log(`Calling ${callname}`, args ? args : '[no args]', '...');

		return co(function *(){
			try {
				var call = LavaboomAPI[obj][method];
				var res = yield call.apply(call, [args]);

				console.log(`${callname}: `, res);

				return res;
			} catch (err) {
				console.error(`${callname} error: `, err.message, err.stack);

				throw err;
			}
		});
	};
});