angular.module(primaryApplicationName).factory('co', function($q, $rootScope, $exceptionHandler) {
	var coWrapper = function (gen) {
		var deferred = $q.defer();

		coJS(function *() {
			try {
				var r = yield gen;

				$rootScope.$apply();

				return r;
			} catch (err) {
				$exceptionHandler(err);

				throw err;
			}
		})
			.then(function () {
				deferred.resolve.apply(deferred.resolve, arguments);
			})
			.catch(function (err){
				deferred.reject(err);
			});

		return deferred.promise;
	};

	coWrapper.wrap = function (gen) {
		var coFn = coJS.wrap(gen);

		return function () {
			var deferred = $q.defer();
			coFn
				.apply(coFn, arguments)
				.then(function () {
					deferred.resolve.apply(deferred.resolve, arguments);
				})
				.catch(function (err){
					deferred.reject(err);
				});
			return deferred.promise;
		};
	};

	return coWrapper;
});
