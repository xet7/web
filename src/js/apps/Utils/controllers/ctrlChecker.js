module.exports = /*@ngInject*/(co, $scope) => {
	const url = process.env.API_URI;
	const token = sessionStorage.lavaboomToken ? sessionStorage.lavaboomToken : localStorage.lavaboomToken;

	console.log('ctrlChecker');

	$scope.initializeApplication = (opts) => co(function *(){
		console.log('checking...');
		if (!token) {
			console.log('checker: no token found!');
			loader.loadLoginApplication({noDelay: true});
			return;
		}

		const api = Lavaboom.getInstance(url, null, 'sockjs');
		api.authToken = token;

		try {
			yield api.connect();

			try {
				const me = yield api.accounts.get('me');
				console.log('checker: accounts.get(me) success', me);

				try {
					const res = yield api.keys.get(`${me.body.user.name}@${process.env.TLD}`);
					console.log('checker: keys.get success', res);

					if (!me.body.user.settings || me.body.user.settings.state != 'ok') {
						console.log('checker: user haven\'t decided with keys');

						if (me.body.user.settings.state == 'backupKeys') {
							loader.loadLoginApplication({state: 'backupKeys', noDelay: true});
						} else {
							loader.loadLoginApplication({state: 'lavaboomSync', noDelay: true});
						}
					} else
						loader.loadMainApplication({noDelay: true});
				} catch(err) {
					console.log('checker: keys.get error', err);
					loader.loadLoginApplication({state: 'generateKeys', noDelay: true});
				}
			} catch(err) {
				console.log('checker: accounts.get(me) error', err);
				loader.loadLoginApplication({noDelay: true});
			}
		} catch (err) {
			console.log('checker: error, cannot connect', err);
			throw err;
		}
	});
};