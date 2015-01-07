module.exports = {
	input: 'src/**/*',
	output: 'dist/',
	scripts: {
		input: 'src/js/*.js',
		inputAll: 'src/js/**/*.js',
		inputApps: 'src/js/apps/*.js',
		output: 'dist/js/'
	},
	styles: {
		input: 'src/less/lavaboom.less',
		output: 'dist/css/'
	},
	svgs: {
		input: 'src/svg/*',
		output: 'dist/svg/'
	},
	img: {
		input: 'src/img/*',
		output: 'dist/img/'
	},
	fonts: {
		input: 'src/fonts/*',
		output: 'dist/css/fonts/'
	},
	main_html: {
		input: 'src/*.html',
		inputJade: 'src/*.jade',
		output: 'dist/'
	},
	partials: {
		input: 'src/blocks/**/*.html',
		inputJade: 'src/blocks/**/*.jade',
		output: 'dist/partials/'
	},
	staticFiles: 'src/static/**',
	vendor: {
		input: 'src/vendor/*.js',
		output: 'dist/vendor/'
	},
	test: {
		input: 'src/js/**/*.js',
		karma: 'test/karma.conf.js',
		spec: 'test/spec/**/*.js',
		coverage: 'test/coverage/',
		results: 'test/results/'
	},
	docs: {
		input: 'src/docs/*.{html,md,markdown}',
		output: 'docs/',
		templates: 'src/docs/_templates/',
		assets: 'src/docs/assets/**'
	}
};