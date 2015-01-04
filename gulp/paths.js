var output = 'dist/';

module.exports = {
	input: 'src/**/*',
	output: output,
	scripts: {
		input: 'src/js/*.js',
		inputAll: 'src/js/**/*.js',
		inputApps: 'src/js/apps/*.js',
		output: output + 'js/'
	},
	styles: {
		input: 'src/less/lavaboom.less',
		output: output + 'css/'
	},
	svgs: {
		input: 'src/svg/*',
		output: output + 'svg/'
	},
	img: {
		input: 'src/img/*',
		output: output + 'img/'
	},
	fonts: {
		input: 'src/fonts/*',
		output: output + 'css/fonts/'
	},
	main_html: {
		input: 'src/*.html',
		inputJade: 'src/*.jade',
		output: output
	},
	partials: {
		input: 'src/blocks/**/*.html',
		inputJade: 'src/blocks/**/*.jade',
		output: output + 'partials/'
	},
	staticFiles: 'src/static/**',
	vendor: {
		input: 'src/vendor/*.js',
		output: output + 'vendor/'
	},
	translations : {
		input: 'src/translations/*.toml',
		output: output + 'translations/'
	},
	tests: {
		unit: {
			input: 'src/tests/*.js',
			output: 'src/tests/out/'
		}
	},
	docs: {
		input: 'src/docs/*.{html,md,markdown}',
		output: 'docs/',
		templates: 'src/docs/_templates/',
		assets: 'src/docs/assets/**'
	}
};