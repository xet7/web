angular.module(primaryApplicationName).config(
	function($provide) {
		$provide.decorator('$timeout', ['$delegate', function ($delegate) {
			$delegate.schedule = (timeoutVariable, action, timeout, invokeApply) => {
				if (timeoutVariable)
					$delegate.cancel(timeoutVariable);
				return $delegate(action, timeout, invokeApply);
			};
			return $delegate;
		}]);
	});