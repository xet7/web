module.exports = /*@ngInject*/($delegate, $q, $http) => {
	$delegate.fetch = (url) => {
		let deferred = $q.defer();

		let template = $delegate.get(url);
		if (template)
			deferred.resolve(template);
		else {
			$http.get(url)
				.then(result => {
					$delegate.put(url, result.data);
					deferred.resolve(result.data);
				})
				.catch(err => deferred.reject(err));
		}

		return deferred.promise;
	};
	return $delegate;
};