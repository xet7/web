angular.module(primaryApplicationName).factory('apiProxy', function($q, co) {
	return function (callname, call, args) {
		console.log(`Calling ${callname}...`, args);

		return co(function *(){
			try {
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