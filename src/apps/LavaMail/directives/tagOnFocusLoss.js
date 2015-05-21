module.exports =  ($parse, $timeout) => {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function (scope, element, attrs, ngModel) {
			var toggleInput = element.find('input')[0];
			toggleInput.addEventListener('blur', (event) => {
				let searchValue = $parse(attrs.tagOnFocusLoss)(scope);
				if (searchValue)
					searchValue = searchValue.trim();

				if (searchValue) {
					const tagTransform = $parse(attrs.tagging)(scope);

					$timeout(() => {
						const target = angular.element(event.explicitOriginalTarget || document.activeElement);
						const isTransferable = (target, lvl = 1) => {
							if (target.hasClass('tag-transferable'))
								return true;

							if (target.parent() && lvl < 3)
								return isTransferable(angular.element(target.parent()), lvl + 1);

							return false;
						};

						if (isTransferable(target)) {
							const tag = tagTransform(searchValue);
							ngModel.$modelValue.push(tag);
						}
					});
				}
			});
		}
	};
};