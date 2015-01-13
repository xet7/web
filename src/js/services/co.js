angular.module(primaryApplicationName).service('co', function($q) {
	var coWrapper = function (gen) {
		var deferred = $q.defer();

		coJS(gen)
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