module.exports = /*@ngInject*/($rootScope, $scope, $interval, $translate, $timeout, translate, user, hotkey, co, notifications) => {
	$scope.form = {
		selectedLanguage: null,
		contactsSortBy: null
	};
	$scope.languages = [];
    $scope.settings = {};

    $rootScope.hotkeys = [];

    $scope.$bind('user-settings', () => {
        $scope.settings = user.settings;
    });

	const translations = {
		LB_NOT_IMPLEMENTED: 'GLOBAL',
		LB_SORT_BY_DISPLAY_NAME : '',
		LB_SORT_BY_FIRST_NAME : '',
		LB_SORT_BY_LAST_NAME : '',
		LB_PROFILE_SAVED: 'MAIN.SETTINGS.PROFILE',
		LB_PROFILE_CANNOT_BE_SAVED: 'MAIN.SETTINGS.PROFILE'
	};

	const translationImages = {
		LB_IMAGES_NONE: '',
		LB_IMAGES_NONE_TITLE: '',
		LB_IMAGES_PROXY: '',
		LB_IMAGES_PROXY_TITLE: '',
		LB_IMAGES_HTTPS: '',
		LB_IMAGES_HTTPS_TITLE: '',
		LB_IMAGES_ALL: '',
		LB_IMAGES_ALL_TITLE: ''
	};

	$translate.bindAsObject(translationImages, 'MAIN.SETTINGS.GENERAL', null, () => {
		$scope.imageSettings = [
			{name: 'none', description: translationImages.LB_IMAGES_NONE, title: translationImages.LB_IMAGES_NONE_TITLE},
			{name: 'proxy', description: translationImages.LB_IMAGES_PROXY, title: translationImages.LB_IMAGES_PROXY_TITLE},
			{name: 'directHttps', description: translationImages.LB_IMAGES_HTTPS, title: translationImages.LB_IMAGES_HTTPS_TITLE},
			{name: 'directAll', description: translationImages.LB_IMAGES_ALL, title: translationImages.LB_IMAGES_ALL_TITLE}
		];
		console.log('$scope.imageSettings', $scope.imageSettings);
	});

	$translate.bindAsObject(translations, 'MAIN.SETTINGS.GENERAL', null, () => {
		$scope.notImplemented = [{name: 'none', description: translations.LB_NOT_IMPLEMENTED}];
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

    $scope.$watch('settings.isHotkeyEnabled', () => {
        hotkey.toggleHotkeys($scope.settings.isHotkeyEnabled);
    });

	const timeouts = {
		clear: null,
		update: null
	};
    $scope.$watch('settings', (o, n) => {
        if (o === n)
			return;

        if (Object.keys($scope.settings).length > 0) {
			timeouts.update = $timeout.schedulePromise(timeouts.update, () => co(function *(){
				try {
					yield user.update($scope.settings);

					notifications.set('profile-save-ok', {
						text: translations.LB_PROFILE_SAVED,
						type: 'info',
						timeout: 3000,
						namespace: 'settings'
					});
				} catch (err) {
					notifications.set('profile-save-fail', {
						text: translations.LB_PROFILE_CANNOT_BE_SAVED,
						namespace: 'settings'
					});
				}
            }), 1000);
        }
    }, true);

};