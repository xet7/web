module.exports = /*@ngInject*/function ($rootScope, $q) {
	var getReader = (deferred, opts) => {
		var reader = new FileReader();

		reader.onload = () => deferred.resolve(reader.result);
		reader.onerror = () => deferred.reject(reader.result);

		if (opts && opts.fileProgress)
			reader.onprogress = event => $rootScope.$apply(() => {
				opts.fileProgress({
					total: event.total,
					loaded: event.loaded
				});
			});

		return reader;
	};

	this.readAsDataURL = (file, opts = {}) => {
		var deferred = $q.defer();

		var reader = getReader(deferred, opts);
		reader.readAsDataURL(file);

		return deferred.promise;
	};

	this.readAsText = (file, opts = {}) => {
		var deferred = $q.defer();

		var reader = getReader(deferred, opts);
		reader.readAsText(file);

		return deferred.promise;
	};
};