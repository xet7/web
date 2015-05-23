module.exports = function (config) {
	config.set({
		basePath: '',

		// (!) we can’t use babel preprocessor (https://github.com/babel/karma-babel-preprocessor) here
		// because of https://github.com/nikku/karma-browserify#transforms
		// and use https://github.com/babel/babelify below
		frameworks: ['browserify', 'jasmine'],

		files: [
			'dist/js/lavaUtils-vendor.js',
			'dist/js/lavaUtils.js',

			'dist/js/lavaMail-vendor.js',
			'dist/js/lavaMail.js',

			'dist/js/lavaLogin.js',

			'dist/js/vendor/LavaUtils/openpgp.js',

			//we should have angular before mock it
			'node_modules/angular-mocks/angular-mocks.js',
			'node_modules/sinon/lib/sinon.js',
			'node_modules/jasmine-sinon/lib/jasmine-sinon.js',
			'node_modules/phantomjs-polyfill/bind-polyfill.js',
			'node_modules/to-have-property/lib/index.js',

			'src/tests/unit/**/*Spec.js'
		],

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
