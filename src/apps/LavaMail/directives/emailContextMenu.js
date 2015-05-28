module.exports = ($templateCache, $compile, co, contacts, user) => ({
	restrict : 'E',
	scope: {
		isOpen: '=',
		noReply: '=',
		email: '='
	},
	link  : (scope, el, attrs) => {
		co(function *(){
			const template = yield $templateCache.fetch('LavaMail/directives/emailContextMenu');
			const contact = contacts.getContactByEmail(scope.email);
			scope.isExistingContact = !!contact;

			if (scope.isExistingContact && scope.noReply)
				return;

			const compiledTemplate = $compile(template)(scope);
			el.prepend(compiledTemplate);
		});
	}
});