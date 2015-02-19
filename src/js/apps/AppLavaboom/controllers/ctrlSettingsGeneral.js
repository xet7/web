module.exports = /*@ngInject*/($rootScope, $scope, $interval, $translate, translate, user) => {
	$scope.form = {
		selectedLanguage: null,
		contactsSortBy: null
	};
	$scope.languages = [];

	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_NOT_IMPLEMENTED = $translate.instant('GLOBAL.LB_NOT_IMPLEMENTED');
		translations.LB_SORT_BY_DISPLAY_NAME = $translate.instant('MAIN.SETTINGS.GENERAL.LB_SORT_BY_DISPLAY_NAME');
		translations.LB_SORT_BY_FIRST_NAME = $translate.instant('MAIN.SETTINGS.GENERAL.LB_SORT_BY_FIRST_NAME');
		translations.LB_SORT_BY_LAST_NAME = $translate.instant('MAIN.SETTINGS.GENERAL.LB_SORT_BY_LAST_NAME');

		$scope.notImplemented = [{name: translations.LB_NOT_IMPLEMENTED}];
		$scope.sortBy = [
			{name: translations.LB_SORT_BY_DISPLAY_NAME},
			{name: translations.LB_SORT_BY_FIRST_NAME},
			{name: translations.LB_SORT_BY_LAST_NAME}
		];

		if (!$scope.form.contactsSortBy)
			$scope.form.contactsSortBy = $scope.sortBy[user.settings.contactsSortBy ? user.settings.contactsSortBy : 0];
	});

	$scope.languages = Object.keys(translate.settings.TRANSLATIONS).reduce((a, langCode) => {
		a.push({
			name: translate.settings.TRANSLATIONS[langCode],
			langCode: langCode
		});
		return a;
	}, []);
	$scope.form.selectedLanguage = $scope.languages.find(e => e.langCode == translate.getCurrentLangCode());

	console.log('initialize CtrlSettingsGeneral', $scope.languages);

	$scope.$watch('form.selectedLanguage', () => {
		if ($scope.form.selectedLanguage)
			translate.switchLanguage($scope.form.selectedLanguage.langCode);
	});

	$scope.$watch('form.contactsSortBy', () => {
		if ($scope.form.contactsSortBy)
			user.update({contactsSortBy: $scope.sortBy.findIndex(e => e.name == $scope.form.contactsSortBy.name)});
	});
};