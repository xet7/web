angular.module(primaryApplicationName).controller('CtrlSettingsPreferences', function($rootScope, $scope, $interval, translate) {
	$scope.form = {
		selectedLanguage: null
	};
	$scope.languages = [];

	$rootScope.$on('initialization-completed', () => {
		$scope.languages = Object.keys(translate.settings.TRANSLATIONS).reduce((a, langCode) => {
			a.push({
				name: translate.settings.TRANSLATIONS[langCode],
				langCode: langCode
			});
			return a;
		}, []);
		$scope.form.selectedLanguage = $scope.languages.find(e => e.langCode == translate.getCurrentLangCode());
	});

	$scope.$watch('form.selectedLanguage', () => {
		if ($scope.form.selectedLanguage)
			translate.switchLanguage($scope.form.selectedLanguage.langCode);
	});
});