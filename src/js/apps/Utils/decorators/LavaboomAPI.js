module.exports = /*@ngInject*/($delegate, $rootScope, $translate, co, utils) => {
	let propsList = ['info', 'accounts', 'files', 'contacts', 'emails', 'labels', 'keys', 'threads', 'tokens'];

	const formatError = (callName, error) => {
		callName = callName.toUpperCase();

		const translate = (name) => {
			let r = $translate.instant(name);
			if (r == name || !r)
				throw new Error(`Translation '${name}' not found!`);
			return r;
		};

		try {
			if (error.body && error.body.message == 'Unexpected end of input')
				return translate(`LAVABOOM.API.ERROR.DOWN`);

			return translate(`LAVABOOM.API.ERROR.${callName}.${error.status}`);
		} catch (err) {
			const def = utils.def(() => translate(`LAVABOOM.API.ERROR.${callName}.DEFAULT`), '');

			try {
				let genericReason = translate(`LAVABOOM.API.ERROR.${error.status}`);
				return def ? `${def} (${genericReason})` : genericReason;
			} catch (err) {
				if (error.body && error.body.message)
					return error.body.message;

				// huh? wtf!
				try {
					return translate(`LAVABOOM.API.ERROR.UNKNOWN`);
				} catch (err) {
					// srsly? wtf!
					return 'unknown error';
				}
			}
		}
	};

	let patchApiMethod = (obj, k, callName) => {
		let originalFunction = obj[k];

		obj[k] = (...args) => {
			console.log(`Calling ${callName}`, args ? args : '[no args]', '...');
			return co(function *() {
				try {
					let res = yield originalFunction(...args);

					console.log(`${callName}: `, res);

					return res;
				} catch (err) {
					let formattedError = formatError(callName, err);
					$rootScope.currentErrorMessage = formattedError;

					console.error(`${callName} error: `, err);

					let error =  new Error(formattedError);
					error.original = err;
					throw error;
				}
			});
		};
	};

	function wrapApiCall (path, obj, k) {
		if (angular.isFunction(obj[k])) {
			let callName = [...path, k].join('.');

			//console.log('patching LavaboomAPI', callName);
			patchApiMethod(obj, k, callName);
		} else
			wrapApiObject([...path, k], obj[k]);
	}

	function wrapApiObject (path, obj) {
		for(let k in obj)
			if (obj.hasOwnProperty(k))
				wrapApiCall(path, obj, k);
	}

	for (let prop of propsList) {
		wrapApiObject([prop], $delegate[prop]);
	}

	return $delegate;
};