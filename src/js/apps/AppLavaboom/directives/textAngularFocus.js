module.exports = /*@ngInject*/ ($parse, $timeout, textAngularManager) => {
	return {
		link: (scope, element, attributes) => {
			$timeout(() => {
				var editorScope = textAngularManager.retrieveEditor(attributes.name).scope;
				editorScope.displayElements.text.triggerHandler('focus');
				editorScope.displayElements.text[0].focus();
			});
		}
	};
};