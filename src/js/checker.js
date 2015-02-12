(() => {
	var loader = window.loader;
	var token = sessionStorage.lavaboomToken ? sessionStorage.lavaboomToken : localStorage.lavaboomToken;

	var Checker = function (url, Promise) {
		this.check = () => new Promise((resolve, reject) => {
			if (token) {
				var api = new Lavaboom(url, null, Promise);
				api.authToken = token;

				api.connect()
					.then(() => {
						api.accounts.get('me').then(res => {
							console.log('checker: accounts.me success', res);
							loader.loadMainApplication();
							resolve();
						}).catch(function(err) {
							console.log('checker: accounts.me error', err);
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

	window.checkerFactory = (Promise) => new Checker(globs.API_URI, Promise);
})();