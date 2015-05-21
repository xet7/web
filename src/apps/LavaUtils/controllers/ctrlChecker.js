module.exports = (co, consts, LavaboomAPI, $scope) => {
	const token = sessionStorage['lava-token'] ? sessionStorage['lava-token'] : localStorage['lava-token'];
	LavaboomAPI.setAuthToken(token);

	$scope.initializeApplication = (opts) => co(function *(){
		if (!token) {
			console.log('checker: no token found!');
			return loader.loadLoginApplication({noDelay: true});
		}

		try {
			yield LavaboomAPI.connect();

			try {
				const me = yield LavaboomAPI.accounts.get('me');
				console.log('checker: accounts.get(me) success', me);

				try {
					const res = yield LavaboomAPI.keys.get(`${me.body.user.name}@${process.env.ROOT_DOMAIN}`);
					console.log('checker: keys.get success', res);

					if (!me.body.user.settings || me.body.user.settings.state != 'ok') {
						console.log('checker: user haven\'t decided with keys');

						return loader.loadLoginApplication({state: 'backupKeys', noDelay: true});
					}

					return loader.loadMainApplication({noDelay: true});
				} catch(err) {
					console.log('checker: keys.get error', err);
					return loader.loadLoginApplication({state: 'generateKeys', noDelay: true});
				}
			} catch(err) {
				console.log('checker: accounts.get(me) error', err);
				return loader.loadLoginApplication({noDelay: true});
			}
		} catch (err) {
			console.log('checker: error, cannot connect', err);
			throw err;
		}
	});
};