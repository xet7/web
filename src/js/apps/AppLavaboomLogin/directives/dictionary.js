var Levenshtein = require('levenshtein');

angular.module(primaryApplicationName).directive('dictionary', ($http, $q) => {
	var words = {};

	return {
		require: 'ngModel',
		link: (scope, elem, attrs, ngModel) => {
			let dictionary = attrs.dictionary;
			let minLevenshteinDistance = attrs.minLevenshteinDistance;

			ngModel.$asyncValidators.dictionary = (modelValue, viewValue) => {
				if (!words[dictionary])
					words[dictionary] = $http.get(dictionary)
						.then(r => r.data.split('\n'));

				return words[dictionary]
					.then(words => {
						for (let word of words) {
							word = word.trim();
							var levenshtein = new Levenshtein(word, viewValue);
							if (levenshtein.distance < minLevenshteinDistance)
								return $q.reject(false);
						}

						return true;
					});
			};
		}
	};
});