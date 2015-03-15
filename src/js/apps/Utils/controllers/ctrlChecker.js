module.exports = /*@ngInject*/(co, consts, LavaboomAPI, $scope) => {
	const token = sessionStorage.lavaboomToken ? sessionStorage.lavaboomToken : localStorage.lavaboomToken;

	const check = (opts) => co(function *(){
		if (!token) {
			console.log('checker: no token found!');
			return {noDelay: true};
		}

		try {
			yield LavaboomAPI.connect();

			try {
				const me = yield LavaboomAPI.accounts.get('me');
				console.log('checker: accounts.get(me) success', me);

				try {
					const res = yield LavaboomAPI.keys.get(`${me.body.user.name}@${process.env.TLD}`);
					console.log('checker: keys.get success', res);

					if (!me.body.user.settings || me.body.user.settings.state != 'ok') {
						console.log('checker: user haven\'t decided with keys');

						if (me.body.user.settings.state == 'backupKeys')
							return {state: 'backupKeys', noDelay: true};

						return {state: 'lavaboomSync', noDelay: true};
					}

					return {noDelay: true};
				} catch(err) {
					console.log('checker: keys.get error', err);
					return {state: 'generateKeys', noDelay: true};
				}
			} catch(err) {
				console.log('checker: accounts.get(me) error', err);
				return {noDelay: true};
			}
		} catch (err) {
			console.log('checker: error, cannot connect', err);
			throw err;
		}
	});

	$scope.initializeApplication = (opts) => co(function *(){
		const loginAppOpts = yield check(opts);
		loader.loadLoginApplication(loginAppOpts);
	});
};