var __Promise = null;

/* jshint ignore:start */
__Promise = (function (func, obj) {
	// Type checking utility function
	function is(type, item) { return (typeof item)[0] == type; }

	// Creates a promise, calling callback(resolve, reject), ignoring other parameters.
	function Promise(callback, handler) {
		// The `handler` variable points to the function that will
		// 1) handle a .then(resolved, rejected) call
		// 2) handle a resolve or reject call (if the first argument === `is`)
		// Before 2), `handler` holds a queue of callbacks.
		// After 2), `handler` is a finalized .then handler.
		handler = function pendingHandler(resolved, rejected, value, queue, then, i) {
			queue = pendingHandler.q;

			function valueHandler(resolved) {
				return function (value) { then && (then = 0, pendingHandler(is, resolved, value)); };
			}

			// Case 1) handle a .then(resolved, rejected) call
			if (resolved != is) {
				return Promise(function (resolve, reject) {
					queue.push({ p: this, r: resolve, j: reject, 1: resolved, 0: rejected });
				});
			}

			// Case 2) handle a resolve or reject call
			// (`resolved` === `is` acts as a sentinel)
			// The actual function signature is
			// .re[ject|solve](<is>, success, value)

			// Check if the value is a promise and try to obtain its `then` method
			if (value && (is(func, value) | is(obj, value))) {
				try { then = value.then; }
				catch (reason) { rejected = 0; value = reason; }
			}
			// If the value is a promise, take over its state
			if (is(func, then)) {
				try { then.call(value, valueHandler(1), rejected = valueHandler(0)); }
				catch (reason) { rejected(reason); }
			}
			// The value is not a promise; handle resolve/reject
			else {
				// Replace this handler with a finalized resolved/rejected handler
				handler = function (Resolved, Rejected) {
					// If the Resolved or Rejected parameter is not a function,
					// return the original promise (now stored in the `callback` variable)
					if (!is(func, (Resolved = rejected ? Resolved : Rejected)))
						return callback;
					// Otherwise, return a finalized promise, transforming the value with the function
					return Promise(function (resolve, reject) { finalize(this, resolve, reject, value, Resolved); });
				};
				// Resolve/reject pending callbacks
				i = 0;
				while (i < queue.length) {
					then = queue[i++];
					// If no callback, just resolve/reject the promise
					if (!is(func, resolved = then[rejected]))
						(rejected ? then.r : then.j)(value);
					// Otherwise, resolve/reject the promise with the result of the callback
					else
						finalize(then.p, then.r, then.j, value, resolved);
				}
			}
		};
		// The queue of pending callbacks; garbage-collected when handler is resolved/rejected
		handler.q = [];

		// Create and return the promise (reusing the callback variable)
		callback.call(callback = { then:    function (resolved, rejected) { return handler(resolved, rejected); },
				"catch": function (rejected)           { return handler(0,        rejected); } },
			function (value)  { handler(is, 1,  value); },
			function (reason) { handler(is, 0, reason); });
		return callback;
	}

	// Finalizes the promise by resolving/rejecting it with the transformed value
	function finalize(promise, resolve, reject, value, transform) {
		setImmediate(function () {
			try {
				// Transform the value through and check whether it's a promise
				value = transform(value);
				transform = value && (is(obj, value) | is(func, value)) && value.then;
				// Return the result if it's not a promise
				if (!is(func, transform))
					resolve(value);
				// If it's a promise, make sure it's not circular
				else if (value == promise)
					reject(TypeError());
				// Take over the promise's state
				else
					transform.call(value, resolve, reject);
			}
			catch (error) { reject(error); }
		});
	}

	// Creates a resolved promise
	Promise.resolve = ResolvedPromise;
	function ResolvedPromise(value) { return Promise(function (resolve) { resolve(value); }); }

	// Creates a rejected promise
	Promise.reject = function (reason) { return Promise(function (resolve, reject) { reject(reason); }); };

	// Transforms an array of promises into a promise for an array
	Promise.all = function (promises) {
		return Promise(function (resolve, reject, count, values) {
			// Array of collected values
			values = [];
			// Resolve immediately if there are no promises
			count = promises.length || resolve(values);
			// Transform all elements (`map` is shorter than `forEach`)
			promises.map(function (promise, index) {
				ResolvedPromise(promise).then(
					// Store the value and resolve if it was the last
					function (value) {
						values[index] = value;
						--count || resolve(values);
					},
					// Reject if one element fails
					reject);
			});
		});
	};

	return Promise;
})('f', 'o');
/* jshint ignore:end */

((Promise, assets, globs) => {
	const
		SRC_APP_LAVABOOM_LOGIN_VENDOR = '/js/appLavaboomLogin-vendor.js',
		SRC_APP_LAVABOOM_MAIN_VENDOR = '/js/appLavaboom-vendor.js',
		SRC_OPENPGP = '/vendor/openpgp.js',
		SRC_APP_LAVABOOM_LOGIN = '/js/appLavaboomLogin.js',
		SRC_APP_LAVABOOM_MAIN = '/js/appLavaboom.js',
		SRC_CHECKER = '/js/checker.js',
		SRC_CHECKER_VENDOR = '/js/checker-vendor.js',
		SRC_TEMPLATE_CACHE = '/js/templates.js';

	const
		LB_DONE = 'Done!',
		LB_FAIL = 'Cannot load Lavaboom :( \n Please check network connection and try again!';

	var // containers
		loaderContainer = document.getElementById('loader-container'),
		loginAppContainer = document.getElementById('login-app-container'),
		mainAppContainer = document.getElementById('main-app-container'),
		containers = [loaderContainer, loginAppContainer, mainAppContainer];

	var
		CHECKER = {
			afterProgressText: 'Checking...',
			afterProgressValue: 30,
			scripts: [
				{
					src: SRC_CHECKER_VENDOR,
					progressText: 'Loading system libraries(1)...'
				},
				{
					src: SRC_CHECKER,
					progressText: 'Loading system libraries(2)...'
				}
			]
		},
		LOADER = {
			container: loaderContainer
		},
		APP_LAVABOOM_LOGIN = {
			appName: 'AppLavaboomLogin',
			container: loginAppContainer,
			afterProgressText: 'Please wait...',
			afterProgressValue: 90,
			scripts: [
				{
					src: SRC_APP_LAVABOOM_LOGIN_VENDOR,
					progressText: 'Loading system libraries(3)...'
				},
				{
					src: SRC_OPENPGP,
					progressText: 'Loading openpgp.js...'
				},
				globs.isProduction ? {
					src: SRC_TEMPLATE_CACHE,
					progressText: 'Loading templates...'
				} : null,
				{
					src: SRC_APP_LAVABOOM_LOGIN,
					progressText: 'Loading Lavaboom...'
				}
			]
		},
		APP_LAVABOOM_MAIN = {
			appName: 'AppLavaboom',
			container: mainAppContainer,
			afterProgressText: 'Please wait...',
			afterProgressValue: 50,
			scripts: [
				{
					src: SRC_APP_LAVABOOM_LOGIN_VENDOR,
					progressText: 'Loading system libraries(3)...'
				},
				{
					src: SRC_APP_LAVABOOM_MAIN_VENDOR,
					progressText: 'Loading system libraries(4)...'
				},
				{
					src: SRC_OPENPGP,
					progressText: 'Loading openpgp.js...'
				},
				globs.isProduction ? {
					src: SRC_TEMPLATE_CACHE,
					progressText: 'Loading templates...'
				} : null,
				{
					src: SRC_APP_LAVABOOM_MAIN,
					progressText: 'Loading Lavaboom...'
				}
			]
		};

	const
		DEBUG_DELAY = 0,
		APP_TRANSITION_DELAY = 1000;

	var loadedScripts = {};

	var loadJS = (src) => new Promise((resolve, reject) => {
		if (loadedScripts[src])
			return resolve();

		var ref = window.document.getElementsByTagName('script')[ 0 ];
		var script = window.document.createElement('script');
		script.src = src;
		script.async = true;
		script.onload = (e) => {
			console.log(`loader loaded '${src}'`, e);
			loadedScripts[src] = true;

			if (DEBUG_DELAY)
				setTimeout(() => {
					resolve(e);
				}, DEBUG_DELAY);
			else
				resolve(e);
		};
		script.onerror = (e) => {
			console.log(`loader: error during loading '${src}'`, e);
			reject();
		};

		ref.parentNode.insertBefore(script, ref);
	});

	var Loader = function () {
		console.log('Initialize loader...');

		var self = this;

		var
			// loader elements
			loaderProgressText = document.getElementById('loader-progress-text'),
			loaderProgressBar = document.getElementById('loader-progress-bar'),

			// state
			isError = false,
			isLoginAppLoaded = false,
			isMainAppLoaded = false,
			isMainApp = false,
			currentProgress,
			progress;

		var showContainer = (e, lbDone, isImmediate = false) => new Promise((resolve) => {
			if (e.container != LOADER.container)
				self.setProgress(lbDone ? lbDone : LB_DONE, 100);

			setTimeout(() => {
				for (let c of containers)
					c.className = 'hidden';
				e.container.className = '';
				resolve();
			}, isImmediate ? 0 : APP_TRANSITION_DELAY);

		});

		var loadScripts = (opts) => new Promise((resolve, reject) => {
			var total = opts.scripts.length;

			var load = (loaded = 0) => {
				var script = null;
				do {
					script = opts.scripts.splice(0, 1)[0];
				} while (!script);

				self.setProgress(script.progressText, Math.ceil(progress + (opts.afterProgressValue - progress) * loaded / total));

				loadJS(globs.isProduction && assets[script.src] ? assets[script.src] : script.src)
					.then(() => {
						if (opts.scripts.length > 0)
							load(loaded + 1);
						else {
							progress = opts.afterProgressValue;
							self.setProgress(opts.afterProgressText, opts.afterProgressValue);

							resolve();
						}
					})
					.catch(e => {
						reject(e);
					});
			};

			load();
		});

		var initializeApplication = (app, opts) => {
			console.log('loader: initializing application', app.appName, opts);

			isMainApp = app.container == APP_LAVABOOM_MAIN.container;

			if (!opts)
				opts = {};

			var rootScope = angular.element(app.container).scope();
			rootScope.$apply(() => {
				console.log('loader: calling rootScope.initializeApplication()');
				rootScope.initializeApplication(opts)
					.then(r => {
						console.log('loader: initialized application', app.appName, 'with result', r);

						showContainer(app, opts.lbDone ? opts.lbDone : (r && r.lbDone ? r.lbDone : null))
							.then(() => {
								if (rootScope.onApplicationReady)
									rootScope.$apply(() => {
										rootScope.onApplicationReady();
									});
							});
					})
					.catch(err => {
						self.setProgressText(err.message);
						isError = true;
						console.error('loader: initialization of application failed', app.appName, 'with error', err.error);
					});
			});
		};

		var loadApplication = (app, opts) => new Promise((resolve, reject) => {
			console.log('loader: loading application', app.appName, opts);
			isMainApp = app.container == APP_LAVABOOM_MAIN.container;

			loadScripts(app)
				.then(() => {
					angular.element(app.container).ready(() => {
						angular.bootstrap(app.container, [app.appName]);

						initializeApplication(app, opts);

						resolve();
					});
				})
				.catch(e => {
					self.setProgressText(LB_FAIL);
					reject(e);
				});
		});

		this.setProgressText = (text) => {
			if (isError)
				return;
			loaderProgressText.innerHTML = text;
		};

		this.setProgress = (text, percent) => {
			if (isError)
				return;

			percent = Math.ceil(percent);

			console.log('loader.progress', percent, text);
			loaderProgressText.innerHTML = text;
			loaderProgressBar.setAttribute('aria-valuenow', percent);
			loaderProgressBar.setAttribute('style', `width: ${percent}%;`);
			currentProgress = percent;
		};

		this.incProgress = (text, percent) => {
			self.setProgress(text, currentProgress + percent);
		};

		this.getProgress = () => currentProgress;

		this.resetProgress = () => {
			progress = 10;

			self.setProgress('', progress);
		};

		this.initialize = () => {
			progress = 10;
			loadScripts(CHECKER)
				.then(() => {
					var checker = window.checkerFactory(Promise);
					console.log('checker', checker);
					checker.check()
						.catch(e => {
							console.error(e);
							self.setProgressText(LB_FAIL);
						});
				})
				.catch(e => {
					console.error(e);
					self.setProgressText(LB_FAIL);
				});
		};

		this.loadLoginApplication = (opts) => {
			if (!opts)
				opts = {};

			isError = false;
			if (isLoginAppLoaded) {
				initializeApplication(APP_LAVABOOM_LOGIN, opts);
				return;
			}

			loadApplication(APP_LAVABOOM_LOGIN, opts)
				.then(() => {
					isLoginAppLoaded = true;
				});
		};

		this.loadMainApplication = (opts) => {
			if (!opts)
				opts = {};

			isError = false;
			if (isMainAppLoaded) {
				initializeApplication(APP_LAVABOOM_MAIN, opts);
				return;
			}

			loadApplication(APP_LAVABOOM_MAIN, opts)
				.then(() => {
					isMainAppLoaded = true;
				});
		};

		this.isMainApplication = () => isMainApp;

		this.showLoader = (isImmediate = false) => {
			showContainer(LOADER, null, isImmediate);
		};
	};

	window.loader = new Loader();
	window.loader.initialize();
})(__Promise, window.assets, window.globs);