module.exports = /*@ngInject*/($rootScope, $scope, $interval, $translate, $timeout, translate, hotkeys, user, Hotkey) => {
	$scope.form = {
		selectedLanguage: null
	};
	$scope.languages = [];
    $scope.settings = {};

    $rootScope.hotkeys = [];

    $scope.$bind('user-settings', () => {
        $scope.settings = user.settings;
    });

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

    $scope.$watch('settings.isHotkeyEnabled', () => {
        Hotkey.toggleHotkeys($scope.settings.isHotkeyEnabled);
    });

    var clearTimeout = null;
    $scope.$watch('status', () => {
        if ($scope.status) {
            clearTimeout = $timeout.schedule(clearTimeout, () => {
                $scope.status = '';
            }, 1000);
        }
    });

    var updateTimeout = null;
    $scope.$watch('settings', (o, n) => {
        if (o === n) return;

        if (Object.keys($scope.settings).length > 0) {
            updateTimeout = $timeout.schedule(updateTimeout, () => {
                user.update($scope.settings)
                .then(() => {
                    $scope.status = 'saved!';
                })
                .catch(() => {
                    $scope.status = 'ops...';
                });
            }, 1000);
        }
    }, true);

};