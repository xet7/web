(() => {
	var loader = window.loader;
	var token = sessionStorage.lavaboomToken ? sessionStorage.lavaboomToken : localStorage.lavaboomToken;

	var Checker = function (url) {
		this.check = () => {
			if (token) {
				var api = new Lavaboom(url, null);
				api.authToken = token;

				api.accounts.get('me').then(res => {
					console.log('checker: accounts.me success', res);
					loader.loadMainApplication();
				}).catch(function(err) {
					console.log('checker: accounts.me error', err);
					loader.loadLoginApplication();
				});
			} else {
				console.log('checker: no token found!');
				loader.loadLoginApplication();
			}
		};
	};

	window.checker = new Checker('https://api.lavaboom.io');
})();