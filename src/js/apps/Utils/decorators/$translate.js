module.exports = /*@ngInject*/($delegate, $q, $rootScope) => {
	const instant = $delegate.instant;
	$delegate.instant = (name, prefix = '') => {
		if (angular.isArray(name))
			return name.reduce((a, c) => {
				const name = prefix ? prefix + '.' + c : c;

				a[name.split('.').slice(-1)[0]] = instant(name);
				return a;
			}, {});

		return instant(name);
	};

	$delegate.bind = (translations, names, prefix = '') => {
		let deferred = $q.defer();

		$rootScope.$bind('$translateChangeSuccess', () => {
			try {
				const translation = $delegate.instant(names, prefix);
				angular.extend(translations, translation);

				deferred.resolve(translations);
			} catch (err) {
				deferred.reject(err);
			}
		});

		return deferred.promise;
	};

	$delegate.bindAsObject = (translations, prefix = '', map = null) => {
		let deferred = $q.defer();

		$rootScope.$bind('$translateChangeSuccess', () => {
			try {
				const translation = $delegate.instant(Object.keys(translations), prefix);
				angular.extend(translations, map ? map(translation) : translation);

				deferred.resolve(translations);
			} catch (err) {
				deferred.reject(err);
			}
		});

		return deferred.promise;
	};

	return $delegate;
};