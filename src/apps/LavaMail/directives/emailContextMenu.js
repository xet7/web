module.exports = ($templateCache, $compile, co, contacts) => ({
	restrict : 'E',
	scope: {
		isOpen: '=',
		email: '='
	},
	link  : (scope, el, attrs) => {
		co(function *(){
			const template = yield $templateCache.fetch('LavaMail/directives/emailContextMenu');
			const contact = contacts.getContactByEmail(scope.email);
			scope.isExistingContact = !!contact;

			const compiledTemplate = $compile(template)(scope);
			el.prepend(compiledTemplate);
		});
	}
});