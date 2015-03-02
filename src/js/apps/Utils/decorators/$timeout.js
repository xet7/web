module.exports = /*@ngInject*/($delegate, $q) => {
	$delegate.schedule = (timeoutVariable, action, timeout, invokeApply) => {
		if (timeoutVariable)
			$delegate.cancel(timeoutVariable);
		return $delegate(action, timeout, invokeApply);
	};

	$delegate.schedulePromise = (timeoutVariable, action, timeout, invokeApply) => {
		if (timeoutVariable)
			$delegate.cancel(timeoutVariable);
		const deferred = $q.defer();

		const t = $delegate(() => {
			try {
				const r = action();

				if (r.then) {
					r
						.then(res => deferred.resolve(res))
						.catch(err => deferred.reject(err));
				} else
					deferred.resolve(r);
			} catch (err) {
				deferred.reject(err);
			}
		}, timeout, invokeApply);

		return [t, deferred.promise];
	};

	return $delegate;
};