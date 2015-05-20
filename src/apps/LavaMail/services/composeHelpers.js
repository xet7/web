module.exports = /*@ngInject*/function ($rootScope, $templateCache, $compile, co, utils) {
	this.buildForwardedTemplate = (body, signature, forwardEmails) => co(function *(){
		return yield utils.fetchAndCompile('/partials/inbox/forwardedEmail.html', {
			body,
			signature,
			forwardEmails
		});
	});

	this.buildRepliedTemplate = (body, signature, replies) => co(function *(){
		return yield utils.fetchAndCompile('/partials/inbox/repliedEmail.html', {
			body,
			signature,
			replies
		});
	});

	this.buildDirectTemplate = (body, signature) => co(function *(){
		return yield utils.fetchAndCompile('/partials/inbox/directEmail.html', {
			body,
			signature
		});
	});
};