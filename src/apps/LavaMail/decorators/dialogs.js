module.exports = /*@ngInject*/($delegate, router) => {
	let confirm = $delegate.confirm;
	let create = $delegate.create;

	$delegate.confirm = (...args) => {
		console.log('dialogs confirm');

		let r = confirm(...args);
		router.registerDialog(r.result);
		return r;
	};

	$delegate.create = (...args) => {
		console.log('dialogs create');
		let r = create(...args);
		router.registerDialog(r.result);
		return r;
	};

	return $delegate;
};