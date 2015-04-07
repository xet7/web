module.exports = /*@ngInject*/($delegate, $q, $rootScope) => {
	$delegate.instantWithPrefix = (name, prefix = '') => {
		if (angular.isArray(name))
			return name.reduce((a, c) => {
				const name = prefix && !c.includes('.') ? prefix + '.' + c : c;

				a[name.split('.').slice(-1)[0]] = $delegate.instant(name);
				return a;
			}, {});

		return $delegate.instant(name);
	};

	$delegate.bind = (translations, names, prefix = '') => {
		let deferred = $q.defer();

		$rootScope.$bind('$translateChangeSuccess', () => {
			try {
				const translation = $delegate.instantWithPrefix(names, prefix);
				angular.extend(translations, translation);

				deferred.resolve(translations);
			} catch (err) {
				deferred.reject(err);
			}
		});

		return deferred.promise;
	};

	$delegate.bindAsObject = (translations, prefix = '', map = null, postProcess = null) => {
		let deferred = $q.defer();

		$rootScope.$bind('$translateChangeSuccess', () => {
			try {
				const translation = $delegate.instantWithPrefix(Object.keys(translations), prefix);
				angular.extend(translations, map ? map(translation) : translation);

				if (postProcess)
					postProcess();

				deferred.resolve(translations);
			} catch (err) {
				deferred.reject(err);
			}
		});

		return deferred.promise;
	};

	return $delegate;
};