angular.module(primaryApplicationName).run(($rootScope, $translate) => {
	$rootScope.trustedHtml = function(html) {
		return $sce.trustAsHtml(html);
	};

	$rootScope.switchLanguage = (langKey) => {
		localStorage.lang = langKey;
		$translate.use(langKey);
	};
});