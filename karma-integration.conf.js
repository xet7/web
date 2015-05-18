module.exports = function (config) {
	config.set({
		basePath: '',

		// (!) we can’t use babel preprocessor (https://github.com/babel/karma-babel-preprocessor) here
		// because of https://github.com/nikku/karma-browserify#transforms
		// and use https://github.com/babel/babelify below
		frameworks: ['browserify', 'jasmine'],

		files: [
			'dist/js/utils-vendor.js',
			'dist/js/appLavaboom-vendor.js',

			'dist/js/appLavaboom.js',
			'dist/js/appLavaboomLogin.js',
			'dist/js/utils.js',
			'dist/vendor/openpgp.js',
			{pattern: 'dist/vendor/openpgp.worker.js', included: false},

			//we should have angular before mock it
			'node_modules/angular-mocks/angular-mocks.js',
			'node_modules/sinon/lib/sinon.js',
			'node_modules/jasmine-sinon/lib/jasmine-sinon.js',
			'node_modules/phantomjs-polyfill/bind-polyfill.js',
			'node_modules/to-have-property/lib/index.js',

			'src/tests/integration/**/*Spec.js'
		],

		proxies: {
			'/vendor': 'http://localhost:9876/base/dist/vendor'
		},

		exclude: [],

		preprocessors: {
			'src/tests/**/*Spec.js': ['browserify']
		},

		browserify: {
			debug: true,
			// put here transformation that should be done before browserify
			transform: ['babelify', 'envify', 'brfs']
		},

		reporters: ['progress'],

		port: 9876,

		colors: true,

		logLevel: config.LOG_INFO,

		autoWatch: true,

		browsers: ['PhantomJS'],

		singleRun: true,

		browserNoActivityTimeout: 60000
	});
};
