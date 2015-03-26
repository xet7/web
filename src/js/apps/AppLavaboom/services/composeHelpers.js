module.exports = /*@ngInject*/function ($rootScope, $templateCache, $compile, co, utils) {
	const self = this;

	const compile = (template, args) => co(function *(){
		const marker = openpgp.util.hexstrdump(openpgp.crypto.random.getRandomBytes(16));
		const templateFunction = $compile(template + '<span ng-bind-html="marker"></span>');

		const isolatedScope = $rootScope.$new(true);

		for(let arg in args)
			isolatedScope[arg] = args[arg];
		isolatedScope.marker = marker;

		const body = templateFunction(isolatedScope);
		console.log('compile body(0)', body);

		yield utils.wait(() => body.text().includes(marker));

		console.log('compile body(1)', body);

		angular.forEach(body.find('span'), e => {
			e = angular.element(e);
			if (e.text() == marker)
				e.remove();
		});

		console.log('compile body(2)', body);

		return body.html();
	});

	this.buildRepliedTemplate = (body, signature, replyHeader, replyBody) => co(function *(){
		const template = yield $templateCache.fetch('/partials/inbox/repliedEmail.html');
		return yield compile(template, {
			body,
			signature,
			replyHeader,
			replyBody
		});
	});

	this.buildDirectTemplate = (body, signature) => co(function *(){
		const template = yield $templateCache.fetch('/partials/inbox/directEmail.html');
		return yield compile(template, {
			body,
			signature
		});
	});
};