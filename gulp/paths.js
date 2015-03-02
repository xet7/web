var output = 'dist/';

module.exports = {
	input: 'src/**/*',
	cache : 'cache/',
	output: output,
	scripts: {
		cacheOutput: './cache/',
		input: 'src/js/*.js',
		inputFolder: 'src/js/',
		inputAll: 'src/js/**/*.js',
		inputApps: ['./src/js/apps/utils.js', './src/js/apps/appLavaboom.js', './src/js/apps/appLavaboomLogin.js', './src/js/loader.js', './src/js/checker.js'],
		inputDeps: 'src/js/apps/*.toml',
		inputAppsFolder: 'src/js/apps/',
		output: output + 'js/'
	},
	styles: {
		input: 'src/less/lavaboom.less',
		inputAll: 'src/less/**/*.less',
		output: output + 'css/'
	},
	svgs: {
		input: 'src/svg/*',
		output: output + 'svg/'
	},
	img: {
		input: 'src/img/**/*',
		output: output + 'img/'
	},
	fonts: {
		input: 'src/fonts/fonts/*',
		output: output + 'css/fonts/'
	},
	markup: {
		input: 'src/*.jade',
		output: output
	},
	partials: {
		input: 'src/blocks/**/*.jade',
		output: output + 'partials/'
	},
	vendor: {
		input: 'src/vendor/*',
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