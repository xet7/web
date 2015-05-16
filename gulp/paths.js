var output = 'dist/';

module.exports = {
	input: 'src/**/*',
	cache: 'cache/',
	output: output,
	plugins: 'plugins/',
	scripts: {
		cacheOutput: './cache/',
		input: 'src/js/*.js',
		inputFolder: 'src/js/',
		inputAll: 'src/js/**/*.js',
		inputApps: [
			'./src/js/apps/Utils/index.toml',
			'./src/js/apps/AppLavaboom/index.toml',
			'./src/js/apps/AppLavaboomLogin/index.toml',
			'./src/js/loader.js'
		],
		inputApplication: './src/js/apps/app.js',
		inputDeps: 'src/js/apps/**/*.toml',
		inputAppsFolder: 'src/js/apps/',
		output: output + 'js/',
		pluginsOutput: output + 'js/plugins.js'
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
		input: ['src/vendor/*', 'src/bower_components/openpgp/dist/*'],
		output: output + 'vendor/'
	},
	translations : {
		inputEn: 'src/translations/en.toml',
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