const config = require('./config');
const output = 'dist/';
const review = 'review/';

module.exports = {
	input: 'src/**/*',
	cache: 'cache/',
	output: output,
	plugins: 'plugins/',
	scripts: {
		cacheOutput: './cache/',
		input: 'src/js/*.js',
		inputFolders: ['src/js/', 'src/apps/'],
		inputAll: 'src/js/**/*.js',
		inputApplication: './src/apps/app.js',
		inputDeps: 'src/apps/**/*.toml',
		inputAppsFolder: 'src/apps/',
		output: output + 'js/'
	},
	styles: {
		input: 'src/less/lavaboom.less',
		inputAll: ['src/less/**/*.less', 'src/fonts/**/*'],
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
		input: ['src/vendor/*', 'src/apps/LavaUtils/bower_components/openpgp/dist/*'],
		output: output + 'vendor/'
	},
	translations : {
		inputEn: 'src/translations/en.toml',
		input: 'src/translations/*.toml',
		output: `${output}/translations/`,
		outputForPlugin: (pluginName) => `${output}/translations/${pluginName}/`
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