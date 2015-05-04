module.exports = /*@ngInject*/($delegate, $q, $rootScope, utils) => {
	const translationTablesCache = {};

	$delegate.instantWithPrefix = (name, prefix = '') => {
		if (angular.isObject(name)) {
			let translationTable = name;
			let originalTranslationTable = translationTable;

			if (!translationTable.__UID) {
				translationTable.__UID = utils.getRandomString(16);
				translationTablesCache[translationTable.__UID] = angular.copy(translationTable);
			} else
				originalTranslationTable = translationTablesCache[translationTable.__UID];

			return Object.keys(originalTranslationTable).reduce((a, translationKey) => {
				if (translationKey.startsWith('__'))
					return a;

				let value = '';
				let isParam = false;

				if (originalTranslationTable[translationKey].startsWith('%')) {
					value = originalTranslationTable[translationKey].substr(1);
					isParam = true;
				} else value = originalTranslationTable[translationKey];

				const resolvedTranslationKey = prefix && !value
						? prefix + '.' + translationKey
						: value + '.' + translationKey;

				a[translationKey] = isParam
					? (argsObject) => $delegate.instant(resolvedTranslationKey, argsObject)
					: $delegate.instant(resolvedTranslationKey);
				return a;
			}, {});
		}

		return $delegate.instant(name);
	};

	$delegate.bindAsObject = (translations, prefix = '', map = null, postProcess = null) => {
		let deferred = $q.defer();

		$rootScope.$bind('$translateChangeSuccess', () => {
			try {
				const currentTranslations = $delegate.instantWithPrefix(translations, prefix);
				const mappedTranslations = map ? map(currentTranslations) : currentTranslations;
				for(let k of Object.keys(mappedTranslations))
					translations[k] = mappedTranslations[k];

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