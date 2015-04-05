module.exports = /*@ngInject*/($delegate, $q, $rootScope) => {
	$delegate.instantWithPrefix = (name, prefix = '') => {
		if (angular.isObject(name)) {
			const translationTable = name;

			return Object.keys(translationTable).reduce((a, translationKey) => {
				const resolvedTranslationKey = prefix && !translationTable[translationKey]
					? prefix + '.' + translationKey
					: translationTable[translationKey] + '.' + translationKey;

				a[translationKey] = $delegate.instant(resolvedTranslationKey);
				return a;
			}, {});
		}

		return $delegate.instant(name);
	};

	$delegate.bindAsObject = (translations, prefix = '', map = null, postProcess = null) => {
		let deferred = $q.defer();

		const originalTranslations = angular.copy(translations);
		$rootScope.$bind('$translateChangeSuccess', () => {
			try {
				const currentTranslations = $delegate.instantWithPrefix(originalTranslations, prefix);
				angular.extend(translations, map ? map(currentTranslations) : currentTranslations);

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