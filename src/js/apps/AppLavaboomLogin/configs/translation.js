angular.module(primaryApplicatioName).config(($translateProvider) => {
	$translateProvider.translations('en', {
		TEST: 'Hi! Im test string in English'
	});

	$translateProvider.translations('de', {
		TEST: 'Hallo! Im Test-String in Englisch'
	});

	$translateProvider.preferredLanguage('en');
});