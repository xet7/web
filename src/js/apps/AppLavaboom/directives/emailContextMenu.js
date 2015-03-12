module.exports = /*@ngInject*/($q, $http, $templateCache, $compile) => {
	const getTemplate = (url) => {
		let deferred = $q.defer();

		let template = $templateCache.get(url);
		if (template)
			deferred.resolve(template);
		else {
			$http.get(url)
				.then(result => deferred.resolve(result.data))
				.catch(err => deferred.reject(err));
		}

		return deferred.promise;
	};

	return {
		restrict : 'E',
		scope: {
			isOpen: '=',
			email: '='
		},
		link  : (scope, el, attrs) => {
			getTemplate('partials/directives/emailContextMenu.html')
				.then(template => {
					console.log('got template', template);
					const compiledTemplate = $compile(template)(scope);
					el.prepend(compiledTemplate);
				});
		}
	};
};