angular.module(primaryApplicationName).factory('co', function($q, $rootScope, $exceptionHandler) {
	var createGeneratorProxy = (gen) => function *() {
		try {
			return (yield gen);
		} catch (err) {
			$exceptionHandler(err);

			throw err;
		} finally {
			$rootScope.$apply();
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

	coWrapper.transform = function (gen, transform) {
		return coWrapper(function *(){
			return transform(yield gen);
		});
	};

	coWrapper.reduce = function (array, reduceGen, init) {
		if (!array)
			return init;

		return coWrapper(function *() {
			for (let i in array) {
				init = yield reduceGen(init, array[i], i, array);
			}
			return init;
		});
	};

	coWrapper.reduceKeys = function (object, reduceGen, init) {
		if (!object)
			return init;

		return coWrapper(function *() {
			for (let i of Object.keys(object)) {
				init = yield reduceGen(init, object[i], i, object);
			}
			return init;
		});
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
