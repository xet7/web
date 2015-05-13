// Karma configuration
// Generated on Wed May 06 2015 20:03:29 GMT+0200 (CEST)

module.exports = function (config) {
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',


		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter

		// (!) we can’t use babel preprocessor (https://github.com/babel/karma-babel-preprocessor) here
		// because of https://github.com/nikku/karma-browserify#transforms
		// and use https://github.com/babel/babelify below
		frameworks: ['browserify', 'jasmine'],


		// list of files / patterns to load in the browser
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


		// list of files to exclude
		exclude: [],


		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
			'src/tests/**/*Spec.js': ['browserify']
		},

		browserify: {
			debug: true,
			// put here transformation that should be done before browserify
			transform: ['babelify', 'envify', 'brfs']
		},


		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['progress'],


		// web server port
		port: 9876,


		// enable / disable colors in the output (reporters and logs)
		colors: true,


		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,


		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,


		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ['PhantomJS'],


		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: true,

		browserNoActivityTimeout: 60000
	});
};
