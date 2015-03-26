module.exports = /*@ngInject*/function ($rootScope, $templateCache, $compile, co, utils) {
	const self = this;

	this.buildReplyTemplate = (body, replyHeader, replyBody) => co(function *(){
		const template = yield $templateCache.fetch('/partials/inbox/reply.html');
		const templateFunction = $compile(template + '<span ng-bind-html="marker"></span>');

		const marker = openpgp.util.hexstrdump(openpgp.crypto.random.getRandomBytes(16));
		const replyArgs = {
			body,
			replyHeader,
			replyBody,
			marker
		};

		body = templateFunction(replyArgs);

		yield utils.wait(() => body.contents().includes(marker));

		console.log('reply body(1)', body);

		for (let e of body.find('span')) {
			e = angular.element(e);
			if (e.text() == marker) {
				e.remove();
				break;
			}
		}

		console.log('reply body(2)', body);

		return body.contents();
	});
};