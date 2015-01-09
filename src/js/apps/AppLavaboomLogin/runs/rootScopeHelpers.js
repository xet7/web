angular.module(primaryApplicatioName).run(($rootScope, $translate) => {
	$rootScope.switchLanguage = (langKey) => {
		$translate.use(langKey);
	};
});