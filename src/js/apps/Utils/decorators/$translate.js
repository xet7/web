module.exports = /*@ngInject*/($delegate, $rootScope) => {
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
		$rootScope.$bind('$translateChangeSuccess', () => {
			angular.extend(translations, $delegate.instant(names, prefix));
		});
	};

	return $delegate;
};