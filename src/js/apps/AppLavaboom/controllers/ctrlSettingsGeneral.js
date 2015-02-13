angular.module(primaryApplicationName).controller('CtrlSettingsGeneral', function($rootScope, $scope, $interval, $translate, translate) {
	$scope.form = {
		selectedLanguage: null
	};
	$scope.languages = [];

	var translations = {};

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_NOT_IMPLEMENTED = $translate.instant('GLOBAL.LB_NOT_IMPLEMENTED');

		$scope.notImplemented = [{name: translations.LB_NOT_IMPLEMENTED}];
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
});