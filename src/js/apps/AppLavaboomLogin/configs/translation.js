angular.module(primaryApplicatioName).config(($translateProvider) => {
	$translateProvider.translations('en', {
		TEST: 'Hi! Im test string in English'
	});

	$translateProvider.useUrlLoader('translate.json');
	$translateProvider.preferredLanguage(localStorage.lang ? localStorage.lang : 'en');
});
