(function (loader) {
	var token = sessionStorage.lavaboomToken ? sessionStorage.lavaboomToken : localStorage.lavaboomToken;

	var Checker = function (url, Promise) {
		console.log('checker', url);
		this.check = () => new Promise((resolve, reject) => {
			if (token) {
				var api = Lavaboom.getInstance(url, null, 'http');
				api.authToken = token;

				api.connect()
					.then(() => {
						api.accounts.get('me').then(me => {
							console.log('checker: accounts.get(me) success', me);
							api.keys.get(`${me.body.user.name}@${process.env.TLD}`)
								.then(res => {
									console.log('checker: keys.get success', res);

									if (!me.body.user.settings || me.body.user.settings.state != 'ok') {
										console.log('checker: user haven\'t decided with keys');
										loader.loadLoginApplication({state: 'backupKeys', noDelay: true});
									} else
										loader.loadMainApplication({noDelay: true});
								})
								.catch(err => {
									console.log('checker: keys.get error', err);
									loader.loadLoginApplication({state: 'generateKeys', noDelay: true});
								});
						}).catch(function (err) {
							console.log('checker: accounts.get(me) error', err);
							loader.loadLoginApplication({noDelay: true});
							resolve();
						});
					})
					.catch(e => {
						console.log('checker: error, cannot connect', e);
						reject(e);
					});
			} else {
				console.log('checker: no token found!');
				loader.loadLoginApplication({noDelay: true});
				resolve();
			}
		});
	};

	window.checkerFactory = (Promise) => new Checker(process.env.API_URI, Promise);
})(window.loader);