module.exports = /*@ngInject*/function ($rootScope, $templateCache, $compile, co, utils) {
	this.buildForwardedTemplate = (body, signature, forwardEmails) => co(function *(){
		return yield utils.fetchAndCompile('LavaMail/inbox/forwardedEmail.html', {
			body,
			signature,
			forwardEmails
		});
	});

	this.buildRepliedTemplate = (body, signature, replies) => co(function *(){
		return yield utils.fetchAndCompile('LavaMail/inbox/repliedEmail.html', {
			body,
			signature,
			replies
		});
	});

	this.buildDirectTemplate = (body, signature) => co(function *(){
		return yield utils.fetchAndCompile('LavaMail/inbox/directEmail.html', {
			body,
			signature
		});
	});
};