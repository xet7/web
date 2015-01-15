module.exports = {
	isProduction: false,
	isDebugable: false,
	livereloadListenAddress: '0.0.0.0',
	livereloadListenPort: 35729,
	listenAddress: '0.0.0.0',
	listenPort: 5000,
	banner: {
		full :
			'/**\n' +
			' * <%= package.name %> v<%= package.version %>\n' +
			' * <%= package.description %>, by <%= package.author.name %>.\n' +
			' * <%= package.repository.url %>\n' +
			' * \n' +
			' * Free to use under the MIT License.\n' +
			' * http://gomakethings.com/mit/\n' +
			' */\n\n',
		min :
			'/**' +
			' <%= package.name %> v<%= package.version %>, by Chris Ferdinandi' +
			' | <%= package.repository.url %>' +
			' | Licensed under MIT: http://gomakethings.com/mit/' +
			' */\n'
	}
};