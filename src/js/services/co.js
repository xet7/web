angular.module(primaryApplicationName).factory('co', function($q, $rootScope, $exceptionHandler) {
	var createGeneratorProxy = (gen) => function *() {
		try {
			var r = yield gen;

			$rootScope.$apply();

			return r;
		} catch (err) {
			$exceptionHandler(err);

			throw err;
		}
	};

	var coWrapper = function (gen) {
		var deferred = $q.defer();

		coJS(createGeneratorProxy(gen))
			.then(function () {
				deferred.resolve.apply(deferred.resolve, arguments);
			})
			.catch(function (err){
				deferred.reject(err);
			});

		return deferred.promise;
	};

	coWrapper.wrap = function (gen) {
		var coFn = coJS.wrap(createGeneratorProxy(gen));

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
