(function (loader) {
	var token = sessionStorage.lavaboomToken ? sessionStorage.lavaboomToken : localStorage.lavaboomToken;

	var Checker = function (url, Promise) {
		console.log('checker', url);
		this.check = () => new Promise((resolve, reject) => {
			if (token) {
				var api = new Lavaboom(url, null, Promise);
				api.authToken = token;

				api.connect()
					.then(() => {
						api.accounts.get('me').then(res => {
							console.log('checker: accounts.get(me) success', res);
							api.keys.get(`${res.body.user.name}@${process.env.TLD}`)
								.then(res => {
									console.log('checker: keys.get success', res);
									loader.loadMainApplication();
								})
								.catch(err => {
									console.log('checker: keys.get error', err);
									loader.loadLoginApplication({state: 'generateKeys'});
								});
						}).catch(function (err) {
							console.log('checker: accounts.get(me) error', err);
							loader.loadLoginApplication();
							resolve();
						});
					})
					.catch(e => {
						console.log('checker: error, cannot connect', e);
						reject(e);
					});
			} else {
				console.log('checker: no token found!');
				loader.loadLoginApplication();
				resolve();
			}
		});
	};

	window.checkerFactory = (Promise) => new Checker(process.env.API_URI, Promise);
})(window.loader);